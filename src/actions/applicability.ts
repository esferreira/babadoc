"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { canManageQuestions } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  const role = (session.user as any).role ?? "member";
  if (!canManageQuestions(role)) throw new Error("Sem permissão");
  return session;
}

export async function getApplicabilityMatrix() {
  const [questions, applicability] = await Promise.all([
    prisma.question.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, order: true, title: true, category: true, priority: true },
    }),
    prisma.questionApplicability.findMany(),
  ]);

  // Build matrix: { questionId -> { artifactType -> priority } }
  const matrix: Record<string, Record<string, string>> = {};
  for (const q of questions) {
    matrix[q.id] = {};
  }
  for (const a of applicability) {
    if (matrix[a.questionId]) {
      matrix[a.questionId][a.artifactType] = a.priority;
    }
  }

  return { questions, matrix };
}

export async function updateApplicability(
  questionId: string,
  artifactType: string,
  priority: string // 'MUST', 'NICE', 'NA', ou 'DEFAULT' (remove override)
) {
  const session = await requireAdmin();

  // Se priority é 'DEFAULT', remove o override (usa priority padrão da question)
  if (priority === "DEFAULT") {
    await prisma.questionApplicability.deleteMany({
      where: { questionId, artifactType },
    });
  } else {
    await prisma.questionApplicability.upsert({
      where: { questionId_artifactType: { questionId, artifactType } },
      update: { priority },
      create: { questionId, artifactType, priority },
    });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  await prisma.auditLog.create({
    data: {
      entityType: "question",
      entityId: questionId,
      action: "update",
      detail: `Aplicabilidade da pergunta #${question?.order} para ${artifactType}: ${priority}`,
      performedBy: session.user?.id,
    },
  });

  revalidatePath("/admin/applicability");
  return { success: true };
}
