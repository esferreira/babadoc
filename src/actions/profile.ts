"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function getUserProfileData(userId?: string) {
  const session = await auth();
  const idToFetch = userId || session?.user?.id;

  if (!idToFetch) return null;

  const user = await prisma.user.findUnique({
    where: { id: idToFetch },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) return null;

  const artifactsOwned = await (prisma as any).artifact.findMany({
    where: { ownerId: idToFetch },
    include: {
      area: { include: { organization: true } },
      _count: { select: { viewLogs: true, favorites: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const recentFacets = await (prisma as any).facet.findMany({
    where: { authorId: idToFetch, isDeleted: false },
    include: {
      question: { select: { title: true } },
      artifact: { select: { id: true, displayName: true, canonicalName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const stats = await Promise.all([
    prisma.artifact.count({ where: { ownerId: idToFetch } }),
    (prisma as any).facet.count({ where: { authorId: idToFetch, isDeleted: false } }),
    (prisma as any).favorite.count({ where: { userId: idToFetch } }),
    (prisma as any).comment.count({ where: { authorId: idToFetch } }),
  ]);

  return {
    user,
    artifactsOwned,
    recentFacets,
    stats: {
      artifacts: stats[0],
      facets: stats[1],
      favorites: stats[2],
      comments: stats[3],
    },
  };
}
