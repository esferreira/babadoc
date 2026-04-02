"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canChangeArtifactStatus } from "@/lib/rbac";

// ====== GET ARTIFACTS (com filtros) ======
export async function getArtifacts(filters?: {
  search?: string;
  type?: string;
  status?: string;
  areaId?: string;
}) {
  const where: any = {};
  if (filters?.search) {
    where.OR = [
      { canonicalName: { contains: filters.search } },
      { displayName: { contains: filters.search } },
    ];
  }
  if (filters?.type) where.artifactType = filters.type;
  if (filters?.status) where.status = filters.status;
  if (filters?.areaId) where.areaId = filters.areaId;

  const artifacts = await prisma.artifact.findMany({
    where,
    include: {
      area: { include: { organization: true } },
      owner: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      facets: { where: { status: "CURRENT", isDeleted: false } as any, select: { id: true, questionId: true } },
      _count: { select: { viewLogs: true } } as any,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Buscar todas as perguntas ativas e a matrix de aplicabilidade
  const [allQuestions, allApplicability] = await Promise.all([
    prisma.question.findMany({ where: { isActive: true } as any, select: { id: true } }),
    (prisma as any).questionApplicability.findMany({ where: { priority: "NA" }, select: { questionId: true, artifactType: true } }),
  ]);

  // Agrupar NAs por tipo de artefato
  const naByType = new Map<string, Set<string>>();
  for (const a of allApplicability) {
    if (!naByType.has(a.artifactType)) naByType.set(a.artifactType, new Set());
    naByType.get(a.artifactType)!.add(a.questionId);
  }

  return artifacts.map((art: any) => {
    const naSet = naByType.get(art.artifactType) ?? new Set();
    const applicableQuestions = allQuestions.filter((q: any) => !naSet.has(q.id));
    const applicableTotal = applicableQuestions.length;
    const answeredApplicable = art.facets.filter(
      (f: any) => f.questionId && !naSet.has(f.questionId)
    ).length;
    return {
      ...art,
      documentationScore:
        applicableTotal > 0
          ? Math.round((answeredApplicable / applicableTotal) * 100)
          : 0,
    };
  });
}

// ====== GET ARTIFACT DETAIL ======
export async function getArtifactDetail(id: string): Promise<{
  artifact: any;
  questions: any[];
  complements: any[];
  pendingReviews: any[];
  documentationScore: number;
} | null> {
  const [artifact, questions] = await Promise.all([
    prisma.artifact.findUnique({
      where: { id },
      include: {
        area: { include: { organization: true } },
        owner: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        facets: {
          where: { status: "CURRENT", isDeleted: false } as any,
          include: {
            question: true,
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
        relationsFrom: {
          include: { targetArtifact: { select: { id: true, canonicalName: true, displayName: true, artifactType: true, status: true } } },
        },
        relationsTo: {
          include: { sourceArtifact: { select: { id: true, canonicalName: true, displayName: true, artifactType: true, status: true } } },
        },
      },
    }),
    prisma.question.findMany({ where: { isActive: true } as any, orderBy: { order: "asc" } }),
  ]);

  if (!artifact) return null;

  // Buscar complementos separadamente
  const complements = await prisma.facet.findMany({
    where: { artifactId: id, status: "COMPLEMENT", isDeleted: false } as any,
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Buscar pendentes de revisão
  const pendingReviews = await prisma.facet.findMany({
    where: { artifactId: id, status: "PENDING_REVIEW", isDeleted: false } as any,
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Buscar applicability para este tipo de artefato
  const applicability = await (prisma as any).questionApplicability.findMany({
    where: { artifactType: artifact.artifactType },
  });
  const applicabilityMap = new Map(applicability.map((a: any) => [a.questionId, a.priority]));

  // Enriquecer questions com prioridade específica do tipo
  const enrichedQuestions = questions.map((q) => ({
    ...q,
    effectivePriority: (applicabilityMap.get(q.id) ?? q.priority) as string,
  }));

  // Score: somente perguntas aplicáveis (não-NA)
  const applicableQuestions = enrichedQuestions.filter((q) => q.effectivePriority !== "NA");
  const applicableTotal = applicableQuestions.length;
  const answeredApplicable = (artifact as any).facets.filter(
    (f: any) => f.questionId && (applicabilityMap.get(f.questionId) ?? "MUST") !== "NA"
  ).length;
  const documentationScore =
    applicableTotal > 0 ? Math.round((answeredApplicable / applicableTotal) * 100) : 0;

  return { artifact, questions: enrichedQuestions, complements, pendingReviews, documentationScore };
}

// ====== GET FORM DATA (areas, users) ======
export async function getArtifactFormData() {
  const [areas, users] = await Promise.all([
    prisma.area.findMany({
      include: { organization: true },
      orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { areas, users };
}

// ====== CREATE ARTIFACT ======
const createArtifactSchema = z.object({
  canonicalName: z.string().min(2).max(100),
  displayName: z.string().min(2).max(200),
  artifactType: z.string(),
  areaId: z.string(),
  ownerId: z.string().optional(),
});

export async function createArtifact(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const raw = {
    canonicalName: formData.get("canonicalName") as string,
    displayName: formData.get("displayName") as string,
    artifactType: formData.get("artifactType") as string,
    areaId: formData.get("areaId") as string,
    ownerId: (formData.get("ownerId") as string) || undefined,
  };

  const parsed = createArtifactSchema.safeParse(raw);
  if (!parsed.success) return { error: "Dados inválidos" };

  try {
    const artifact = await prisma.artifact.create({
      data: {
        ...parsed.data,
        status: "draft",
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "artifact",
        entityId: artifact.id,
        action: "create",
        performedBy: session.user.id,
        artifactId: artifact.id,
        newValues: JSON.stringify(parsed.data),
      },
    });

    revalidatePath("/dashboard");
    return { success: true, id: artifact.id };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "Nome canônico já existe." };
    return { error: "Erro ao criar artifact." };
  }
}

// ====== UPDATE STATUS ======
export async function updateArtifactStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const role = (session.user as any)?.role ?? "member";
  if (!canChangeArtifactStatus(role)) {
    return { error: "Sem permissão. Apenas editores e administradores podem alterar o status de artefatos." };
  }

  await prisma.artifact.update({ where: { id }, data: { status } });

  await (prisma.auditLog as any).create({
    data: {
      entityType: "artifact", entityId: id, action: "status_change",
      detail: `Status alterado para '${status}'`,
      artifactId: id, performedBy: session.user.id,
    },
  });

  revalidatePath(`/artifacts/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

// ====== GET STATS FOR DASHBOARD ======
export async function getDashboardStats() {
  const [total, byStatus, byType] = await Promise.all([
    prisma.artifact.count(),
    prisma.artifact.groupBy({ by: ["status"], _count: true }),
    prisma.artifact.groupBy({ by: ["artifactType"], _count: true }),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    byType: Object.fromEntries(byType.map((t) => [t.artifactType, t._count])),
  };
}

// ====== DUPLICATE ARTIFACT ======
export async function duplicateArtifact(sourceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const source = await prisma.artifact.findUnique({
    where: { id: sourceId },
    include: { tags: true },
  });
  if (!source) return { error: "Artifact não encontrado" };

  const newName = `${source.canonicalName}_copy_${Date.now().toString(36)}`;
  const newArtifact = await prisma.artifact.create({
    data: {
      canonicalName: newName,
      displayName: `${source.displayName} (Cópia)`,
      artifactType: source.artifactType,
      areaId: source.areaId,
      ownerId: session.user.id,
      status: "draft",
    },
  });

  // Copiar tags
  if (source.tags.length > 0) {
    await (prisma as any).artifactTag.createMany({
      data: source.tags.map((t: any) => ({
        artifactId: newArtifact.id,
        tagId: t.tagId,
      })),
    });
  }

  await (prisma.auditLog as any).create({
    data: {
      entityType: "artifact", entityId: newArtifact.id, action: "duplicate",
      detail: `Duplicado a partir de ${source.displayName}`,
      artifactId: newArtifact.id, performedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, id: newArtifact.id };
}

// ====== FULL-TEXT SEARCH (artifacts + facet content) ======
export async function searchFullText(query: string) {
  if (!query || query.length < 2) return [];

  const artifacts = await prisma.artifact.findMany({
    where: {
      OR: [
        { canonicalName: { contains: query } },
        { displayName: { contains: query } },
      ],
    } as any,
    select: {
      id: true, displayName: true, canonicalName: true,
      artifactType: true, status: true,
    },
    take: 10,
  });

  const facets = await prisma.facet.findMany({
    where: {
      contentMarkdown: { contains: query },
      isDeleted: false,
      status: "CURRENT",
    } as any,
    select: {
      id: true, artifactId: true, questionId: true,
      contentMarkdown: true,
      artifact: { select: { displayName: true } },
      question: { select: { title: true } },
    },
    take: 10,
  });

  return {
    artifacts: artifacts.map((a: any) => ({
      type: "artifact" as const,
      id: a.id,
      title: a.displayName,
      subtitle: a.canonicalName,
      artifactType: a.artifactType,
      status: a.status,
    })),
    facets: facets.map((f: any) => {
      const idx = (f.contentMarkdown ?? "").toLowerCase().indexOf(query.toLowerCase());
      const snippet = idx >= 0
        ? "…" + (f.contentMarkdown ?? "").slice(Math.max(0, idx - 40), idx + 80) + "…"
        : "";
      return {
        type: "facet" as const,
        id: f.artifactId,
        title: f.question?.title ?? "Resposta",
        subtitle: f.artifact?.displayName ?? "",
        snippet: snippet.replace(/<[^>]+>/g, ""),
      };
    }),
  };
}

// ====== RECENT ACTIVITY FEED ======
export async function getRecentActivity(limit = 15) {
  const logs = await (prisma.auditLog as any).findMany({
    orderBy: { performedAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      artifact: { select: { displayName: true } },
    },
  });

  return logs.map((log: any) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    detail: log.detail,
    user: log.user?.name ?? log.user?.email ?? "Sistema",
    artifactName: log.artifact?.displayName,
    artifactId: log.artifactId,
    performedAt: log.performedAt,
  }));
}

// ====== COVERAGE BY AREA ======
export async function getCoverageByArea() {
  const areas = await prisma.area.findMany({
    include: {
      organization: true,
      artifacts: {
        include: {
          facets: { where: { status: "CURRENT", isDeleted: false } as any, select: { id: true, questionId: true } },
        },
      },
    },
  });

  const totalQuestions = await prisma.question.count({ where: { isActive: true } as any });

  return areas.map((area: any) => {
    const totalAnswered = area.artifacts.reduce(
      (sum: number, art: any) => sum + art.facets.length, 0
    );
    const totalPossible = area.artifacts.length * totalQuestions;
    return {
      id: area.id,
      name: area.name,
      organization: area.organization.name,
      artifactCount: area.artifacts.length,
      answeredCount: totalAnswered,
      possibleCount: totalPossible,
      score: totalPossible > 0 ? Math.round((totalAnswered / totalPossible) * 100) : 0,
    };
  });
}

export async function deleteArtifact(id: string) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    // Somente o dono ou o admin podem deletar.
    const art = await prisma.artifact.findUnique({ where: { id }, select: { ownerId: true } });
    if (art?.ownerId !== session?.user?.id) throw new Error("Unauthorized");
  }

  await prisma.artifact.delete({
    where: { id },
  });
}
