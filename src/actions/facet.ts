"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { canDeleteFacet, canEditFacet } from "@/lib/rbac";

// ====== UPSERT FACET (Responder ou Complementar Pergunta) ======
export async function upsertFacet(data: {
  artifactId: string;
  questionId: string;
  contentMarkdown: string;
  facetType: string;
  targetAudience?: string;
  isComplement?: boolean;
  submissionMode?: "complement" | "replacement";
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const { artifactId, questionId, contentMarkdown, facetType, targetAudience = "both", isComplement = false, submissionMode } = data;
  const role = (session.user as any)?.role ?? "member";

  // === SUBSTITUIÇÃO: criar com status PENDING_REVIEW ===
  if (submissionMode === "replacement") {
    const newFacet = await prisma.facet.create({
      data: {
        artifactId, questionId, facetType, targetAudience, contentMarkdown,
        status: "PENDING_REVIEW", version: 1,
        authorId: session.user.id!,
      },
    });

    await (prisma.auditLog as any).create({
      data: {
        entityType: "facet", entityId: newFacet.id, action: "submit_replacement",
        detail: `Substituição submetida para aprovação`,
        artifactId, performedBy: session.user.id,
      },
    });

    revalidatePath(`/artifacts/${artifactId}`);
    return { success: true, facetId: newFacet.id };
  }

  // === COMPLEMENTO: criar sem afetar a resposta principal ===
  if (isComplement) {
    // Contar complementos existentes para gerar numeração
    const existingComplements = await prisma.facet.count({
      where: { artifactId, questionId, status: "COMPLEMENT", isDeleted: false } as any,
    });

    const newFacet = await prisma.facet.create({
      data: {
        artifactId, questionId, facetType, targetAudience, contentMarkdown,
        status: "COMPLEMENT", version: existingComplements + 1,
        authorId: session.user.id!,
      },
    });

    await (prisma.auditLog as any).create({
      data: {
        entityType: "facet", entityId: newFacet.id, action: "complement",
        detail: `Complemento #${existingComplements + 1} adicionado`,
        artifactId, performedBy: session.user.id,
      },
    });

    revalidatePath(`/artifacts/${artifactId}`);
    return { success: true, facetId: newFacet.id };
  }

  // === RESPOSTA PRINCIPAL: upsert do CURRENT ===
  const existing = await prisma.facet.findFirst({
    where: { artifactId, questionId, status: "CURRENT", isDeleted: false } as any,
  });

  if (existing) {
    // Validar permissão: member só edita suas próprias respostas
    if (!canEditFacet(role, session.user.id, existing.authorId)) {
      return {
        error: "Sem permissão para editar esta resposta. Você só pode editar respostas que você criou. Use 'Adicionar Complemento' para contribuir.",
      };
    }

    await prisma.facet.update({
      where: { id: existing.id },
      data: { status: "ARCHIVED" },
    });

    const newFacet = await prisma.facet.create({
      data: {
        artifactId, questionId, facetType, targetAudience, contentMarkdown,
        status: "CURRENT", version: existing.version + 1,
        previousId: existing.id, authorId: session.user.id!,
      },
    });

    await (prisma.auditLog as any).create({
      data: {
        entityType: "facet", entityId: newFacet.id, action: "update",
        detail: `Facet v${newFacet.version} para pergunta atualizada`,
        artifactId, performedBy: session.user.id,
      },
    });

    revalidatePath(`/artifacts/${artifactId}`);
    return { success: true, facetId: newFacet.id };
  } else {
    // Nova resposta — todos podem criar
    const newFacet = await prisma.facet.create({
      data: {
        artifactId, questionId, facetType, targetAudience, contentMarkdown,
        status: "CURRENT", version: 1, authorId: session.user.id!,
      },
    });

    await (prisma.auditLog as any).create({
      data: {
        entityType: "facet", entityId: newFacet.id, action: "create",
        detail: `Nova resposta criada para pergunta`,
        artifactId, performedBy: session.user.id,
      },
    });

    revalidatePath(`/artifacts/${artifactId}`);
    return { success: true, facetId: newFacet.id };
  }
}

// ====== SOFT DELETE FACET ======
export async function softDeleteFacet(facetId: string, artifactId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const facet = await prisma.facet.findUnique({ where: { id: facetId } });
  if (!facet) return { error: "Facet não encontrada" };

  const role = (session.user as any).role ?? "member";
  if (!canDeleteFacet(role, session.user.id, facet.authorId)) {
    return { error: "Sem permissão para deletar esta resposta." };
  }

  await prisma.facet.update({
    where: { id: facetId },
    data: { isDeleted: true, deletedAt: new Date(), deletedById: session.user.id } as any,
  });

  await (prisma.auditLog as any).create({
    data: {
      entityType: "facet", entityId: facetId, action: "soft_delete",
      detail: `Facet deletada por ${(session.user as any).name ?? session.user.email}`,
      artifactId, performedBy: session.user.id,
    },
  });

  revalidatePath(`/artifacts/${artifactId}`);
  return { success: true };
}

// ====== RESTORE FACET ======
export async function restoreFacet(facetId: string, artifactId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const role = (session.user as any).role ?? "member";
  if (role !== "admin") return { error: "Apenas administradores podem restaurar respostas" };

  await prisma.facet.update({
    where: { id: facetId },
    data: { isDeleted: false, deletedAt: null, deletedById: null } as any,
  });

  await (prisma.auditLog as any).create({
    data: {
      entityType: "facet", entityId: facetId, action: "restore",
      detail: `Facet restaurada por admin`,
      artifactId, performedBy: session.user.id,
    },
  });

  revalidatePath(`/artifacts/${artifactId}`);
  return { success: true };
}

// ====== APROVAR SUBSTITUIÇÃO ======
export async function approveFacetReplacement(pendingFacetId: string, artifactId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const role = (session.user as any)?.role ?? "member";
  if (role === "member") {
    return { error: "Apenas editores e administradores podem aprovar substituições." };
  }

  const pendingFacet = await prisma.facet.findUnique({ where: { id: pendingFacetId } });
  if (!pendingFacet || pendingFacet.status !== "PENDING_REVIEW") {
    return { error: "Facet não encontrada ou já processada" };
  }

  // Arquivar a resposta atual
  const currentFacet = await prisma.facet.findFirst({
    where: { artifactId: pendingFacet.artifactId, questionId: pendingFacet.questionId, status: "CURRENT", isDeleted: false } as any,
  });

  if (currentFacet) {
    await prisma.facet.update({
      where: { id: currentFacet.id },
      data: { status: "ARCHIVED" },
    });
  }

  // Promover a pendente para CURRENT
  await prisma.facet.update({
    where: { id: pendingFacetId },
    data: {
      status: "CURRENT",
      version: currentFacet ? currentFacet.version + 1 : 1,
      previousId: currentFacet?.id ?? null,
    },
  });

  await (prisma.auditLog as any).create({
    data: {
      entityType: "facet", entityId: pendingFacetId, action: "approve_replacement",
      detail: `Substituição aprovada por ${(session.user as any).name ?? session.user.email}`,
      artifactId, performedBy: session.user.id,
    },
  });

  revalidatePath(`/artifacts/${artifactId}`);
  return { success: true };
}

// ====== REJEITAR SUBSTITUIÇÃO ======
export async function rejectFacetReplacement(pendingFacetId: string, artifactId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const role = (session.user as any)?.role ?? "member";
  if (role === "member") {
    return { error: "Apenas editores e administradores podem rejeitar substituições." };
  }

  await prisma.facet.update({
    where: { id: pendingFacetId },
    data: { status: "REJECTED", isDeleted: true, deletedAt: new Date(), deletedById: session.user.id } as any,
  });

  await (prisma.auditLog as any).create({
    data: {
      entityType: "facet", entityId: pendingFacetId, action: "reject_replacement",
      detail: `Substituição rejeitada por ${(session.user as any).name ?? session.user.email}`,
      artifactId, performedBy: session.user.id,
    },
  });

  revalidatePath(`/artifacts/${artifactId}`);
  return { success: true };
}

// ====== GET FACET HISTORY ======
export async function getFacetHistory(artifactId: string, questionId: string) {
  return prisma.facet.findMany({
    where: { artifactId, questionId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      deletedBy: { select: { id: true, name: true, email: true } } as any,
    },
    orderBy: { createdAt: "desc" },
  });
}
