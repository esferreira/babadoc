"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function logView(artifactId: string, questionId?: string) {
  const session = await auth();
  await (prisma as any).viewLog.create({
    data: {
      artifactId,
      questionId: questionId ?? null,
      userId: session?.user?.id ?? null,
    },
  });
}

export async function getViewCount(artifactId: string): Promise<number> {
  return (prisma as any).viewLog.count({
    where: { artifactId },
  });
}
