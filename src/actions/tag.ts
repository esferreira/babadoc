"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAllTags() {
  return (prisma as any).tag.findMany({
    orderBy: [{ category: "asc" }, { value: "asc" }],
  });
}

export async function updateArtifactTags(artifactId: string, tagIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  // Deleta todas as tags relacionadas ao artifact
  await (prisma as any).artifactTag.deleteMany({
    where: { artifactId },
  });

  // Insere as novas selecionadas
  if (tagIds.length > 0) {
    await (prisma as any).artifactTag.createMany({
      data: tagIds.map((tagId) => ({ artifactId, tagId })),
    });
  }

  // Gera audit log para a mudança
  await (prisma.auditLog as any).create({
    data: {
      entityType: "artifact",
      entityId: artifactId,
      action: "update",
      detail: `Tags atualizadas para ${tagIds.length} tag(s)`,
      artifactId: artifactId,
      performedBy: session.user.id,
    },
  });

  revalidatePath(`/artifacts/${artifactId}`);
  return { success: true };
}
