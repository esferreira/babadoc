"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function getUnreadNotificationsCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return (prisma as any).notification.count({
    where: { userId: session.user.id, read: false },
  });
}

export async function getNotifications(take = 20) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return (prisma as any).notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await (prisma as any).notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  await (prisma as any).notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
}

export async function createNotification(userId: string, data: { type: string; title: string; message?: string; link?: string }) {
  await (prisma as any).notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    },
  });
}
