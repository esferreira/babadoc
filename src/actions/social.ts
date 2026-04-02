"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(artifactId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const existing = await (prisma as any).favorite.findUnique({
    where: { userId_artifactId: { userId: session.user.id, artifactId } },
  });

  if (existing) {
    await (prisma as any).favorite.delete({ where: { id: existing.id } });
  } else {
    await (prisma as any).favorite.create({
      data: { userId: session.user.id, artifactId },
    });
  }

  revalidatePath("/dashboard");
  return { isFavorite: !existing };
}

export async function getFavorites() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const favs = await (prisma as any).favorite.findMany({
    where: { userId: session.user.id },
    include: {
      artifact: {
        select: { id: true, displayName: true, artifactType: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favs.map((f: any) => f.artifact);
}

export async function isFavorite(artifactId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;

  const existing = await (prisma as any).favorite.findUnique({
    where: { userId_artifactId: { userId: session.user.id, artifactId } },
  });
  return !!existing;
}

// ====== COMMENTS ======
export async function addComment(artifactId: string, questionId: string | null, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };
  if (!content.trim()) return { error: "Comentário vazio" };

  await (prisma as any).comment.create({
    data: {
      content: content.trim(),
      authorId: session.user.id,
      artifactId,
      questionId,
    },
  });

  revalidatePath(`/artifacts/${artifactId}`);
  return { success: true };
}

export async function getComments(artifactId: string, questionId?: string) {
  const where: any = { artifactId };
  if (questionId) where.questionId = questionId;

  return (prisma as any).comment.findMany({
    where,
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
