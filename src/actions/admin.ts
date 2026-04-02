"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { canManageUsers, canManageQuestions } from "@/lib/rbac";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

// ====== HELPER: Verifica admin ======
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  const role = (session.user as any).role ?? "member";
  if (!canManageUsers(role)) throw new Error("Sem permissão");
  return session;
}

// ====== USERS ======
export async function getUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!email || !password) return { error: "Email e senha são obrigatórios" };

  const hashedPassword = await hash(password, 12);
  try {
    await prisma.user.create({
      data: { email, name: name || null, hashedPassword, role: role || "member" },
    });
    await prisma.auditLog.create({
      data: {
        entityType: "user", entityId: email, action: "create",
        detail: `Usuário ${email} criado com role ${role || "member"}`,
        performedBy: (await auth())?.user?.id,
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "Email já cadastrado" };
    return { error: "Erro ao criar usuário" };
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  const session = await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado" };

  const oldRole = user.role;
  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  await prisma.auditLog.create({
    data: {
      entityType: "user", entityId: userId, action: "update",
      detail: `Role de ${user.email} alterado de ${oldRole} para ${newRole}`,
      oldValues: JSON.stringify({ role: oldRole }),
      newValues: JSON.stringify({ role: newRole }),
      performedBy: session.user?.id,
    },
  });
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleUserActive(userId: string) {
  const session = await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado" };
  if (user.id === session.user?.id) return { error: "Não pode desativar a si mesmo" };

  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  await prisma.auditLog.create({
    data: {
      entityType: "user", entityId: userId,
      action: user.isActive ? "delete" : "restore",
      detail: `Usuário ${user.email} ${user.isActive ? "desativado" : "reativado"}`,
      performedBy: session.user?.id,
    },
  });
  revalidatePath("/admin");
  return { success: true };
}

// ====== QUESTIONS ======
export async function getQuestions() {
  return prisma.question.findMany({ orderBy: { order: "asc" } });
}

export async function createQuestion(formData: FormData) {
  const session = await requireAdmin();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const subCategory = formData.get("subCategory") as string;
  const priority = formData.get("priority") as string;
  const facetType = formData.get("facetType") as string;

  if (!title || !category || !priority || !facetType)
    return { error: "Preencha todos os campos obrigatórios" };

  const maxOrder = await prisma.question.findFirst({ orderBy: { order: "desc" } });
  const newOrder = (maxOrder?.order ?? 0) + 1;

  await prisma.question.create({
    data: { order: newOrder, title, description: description || null, category, subCategory: subCategory || null, priority, facetType },
  });
  await prisma.auditLog.create({
    data: {
      entityType: "question", entityId: String(newOrder), action: "create",
      detail: `Pergunta #${newOrder}: "${title}" criada`,
      performedBy: session.user?.id,
    },
  });
  revalidatePath("/admin");
  return { success: true };
}

export async function updateQuestion(id: string, formData: FormData) {
  const session = await requireAdmin();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const subCategory = formData.get("subCategory") as string;
  const priority = formData.get("priority") as string;
  const facetType = formData.get("facetType") as string;

  const old = await prisma.question.findUnique({ where: { id } });
  if (!old) return { error: "Pergunta não encontrada" };

  await prisma.question.update({
    where: { id },
    data: { title, description: description || null, category, subCategory: subCategory || null, priority, facetType },
  });
  await prisma.auditLog.create({
    data: {
      entityType: "question", entityId: id, action: "update",
      detail: `Pergunta #${old.order} atualizada`,
      oldValues: JSON.stringify({ title: old.title, category: old.category }),
      newValues: JSON.stringify({ title, category }),
      performedBy: session.user?.id,
    },
  });
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleQuestionActive(id: string) {
  const session = await requireAdmin();
  const q = await prisma.question.findUnique({ where: { id } });
  if (!q) return { error: "Pergunta não encontrada" };

  await prisma.question.update({ where: { id }, data: { isActive: !q.isActive } });
  await prisma.auditLog.create({
    data: {
      entityType: "question", entityId: id,
      action: q.isActive ? "delete" : "restore",
      detail: `Pergunta #${q.order} ${q.isActive ? "desativada" : "reativada"}`,
      performedBy: session.user?.id,
    },
  });
  revalidatePath("/admin");
  return { success: true };
}

// ====== AUDIT LOGS ======
export async function getAuditLogs(filters?: {
  entityType?: string;
  action?: string;
  page?: number;
}) {
  const take = 50;
  const skip = ((filters?.page ?? 1) - 1) * take;
  const where: any = {};
  if (filters?.entityType) where.entityType = filters.entityType;
  if (filters?.action) where.action = filters.action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        artifact: { select: { displayName: true, canonicalName: true } },
      },
      orderBy: { performedAt: "desc" },
      take,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, pages: Math.ceil(total / take) };
}

// ====== ANALYTICS ======
export async function getAnalyticsSummary() {
  const [totalViews, viewsByArtifact, viewsByQuestion, recentViews] = await Promise.all([
    prisma.viewLog.count(),
    prisma.viewLog.groupBy({
      by: ["artifactId"],
      _count: true,
      _avg: { durationMs: true },
      orderBy: { _count: { artifactId: "desc" } },
      take: 10,
    }),
    prisma.viewLog.groupBy({
      by: ["questionId"],
      where: { questionId: { not: null } },
      _count: true,
      _avg: { durationMs: true },
      orderBy: { _count: { questionId: "desc" } },
      take: 10,
    }),
    prisma.viewLog.findMany({
      include: {
        artifact: { select: { displayName: true } },
        question: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { viewedAt: "desc" },
      take: 20,
    }),
  ]);

  // Enriquecer com nomes
  const artifactIds = viewsByArtifact.map((v) => v.artifactId);
  const artifacts = await prisma.artifact.findMany({
    where: { id: { in: artifactIds } },
    select: { id: true, displayName: true, canonicalName: true },
  });
  const artifactMap = new Map(artifacts.map((a) => [a.id, a]));

  const questionIds = viewsByQuestion.map((v) => v.questionId).filter(Boolean) as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, title: true, order: true },
  });
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  return {
    totalViews,
    topArtifacts: viewsByArtifact.map((v) => ({
      artifact: artifactMap.get(v.artifactId),
      views: v._count,
      avgDurationMs: Math.round(v._avg.durationMs ?? 0),
    })),
    topQuestions: viewsByQuestion.map((v) => ({
      question: questionMap.get(v.questionId!),
      views: v._count,
      avgDurationMs: Math.round(v._avg.durationMs ?? 0),
    })),
    recentViews,
  };
}
