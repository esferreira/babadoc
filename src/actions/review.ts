"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function setReviewSchedule(artifactId: string, frequencyDays: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const now = new Date();
  const nextReview = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

  await (prisma as any).reviewSchedule.upsert({
    where: { artifactId },
    update: { frequencyDays, nextReviewAt: nextReview },
    create: { artifactId, frequencyDays, nextReviewAt: nextReview },
  });

  revalidatePath(`/artifacts/${artifactId}`);
  revalidatePath("/reviews");
  return { success: true };
}

export async function markReviewed(artifactId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const schedule = await (prisma as any).reviewSchedule.findUnique({
    where: { artifactId },
  });

  if (!schedule) return { error: "Sem agendamento" };

  const now = new Date();
  const nextReview = new Date(now.getTime() + schedule.frequencyDays * 24 * 60 * 60 * 1000);

  await (prisma as any).reviewSchedule.update({
    where: { artifactId },
    data: { lastReviewedAt: now, nextReviewAt: nextReview },
  });

  await (prisma.auditLog as any).create({
    data: {
      entityType: "artifact", entityId: artifactId, action: "review",
      detail: "Revisão periódica concluída",
      artifactId, performedBy: session.user.id,
    },
  });

  revalidatePath(`/artifacts/${artifactId}`);
  revalidatePath("/reviews");
  return { success: true };
}

export async function getPendingReviewsList() {
  const now = new Date();

  const overdue = await (prisma as any).reviewSchedule.findMany({
    where: { nextReviewAt: { lte: now } },
    include: {
      artifact: {
        select: { id: true, displayName: true, canonicalName: true, artifactType: true, status: true },
      },
    },
    orderBy: { nextReviewAt: "asc" },
  });

  const upcoming = await (prisma as any).reviewSchedule.findMany({
    where: { nextReviewAt: { gt: now } },
    include: {
      artifact: {
        select: { id: true, displayName: true, canonicalName: true, artifactType: true, status: true },
      },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 10,
  });

  return { overdue, upcoming };
}

export async function getReviewSchedule(artifactId: string) {
  return (prisma as any).reviewSchedule.findUnique({
    where: { artifactId },
  });
}
