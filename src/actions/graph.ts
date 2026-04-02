"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getRelationshipGraph() {
  const artifacts = await prisma.artifact.findMany({
    select: {
      id: true,
      displayName: true,
      canonicalName: true,
      artifactType: true,
      status: true,
    },
  });

  const relationships = await (prisma as any).artifactRelationship.findMany({
    select: {
      id: true,
      sourceArtifactId: true,
      targetArtifactId: true,
      relationshipType: true,
      description: true,
    },
  });

  return { nodes: artifacts, edges: relationships };
}

export async function createRelationship(sourceId: string, targetId: string, type: string, description?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  await (prisma as any).artifactRelationship.create({
    data: {
      sourceArtifactId: sourceId,
      targetArtifactId: targetId,
      relationshipType: type,
      description: description || null,
    },
  });

  revalidatePath("/graph");
  return { success: true };
}

export async function deleteRelationship(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  await (prisma as any).artifactRelationship.delete({ where: { id } });
  revalidatePath("/graph");
  return { success: true };
}
