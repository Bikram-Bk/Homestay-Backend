import prisma from "../config/database.js";


export async function createNotification(userId, title, message) {
  try {
    return await prisma.notification.create({
      data: { userId, title, message },
    });
  } catch (err) {
    console.warn(`[notification] Failed to create for ${userId}:`, err.message);
    return null;
  }
}


export async function getMyNotifications(userId, query = {}) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  const skip = (page - 1) * limit;

  const [total, unread, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { notifications, unread, total, page, totalPages: Math.ceil(total / limit) };
}

export async function markAsRead(userId, notificationId) {
  const n = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!n) {
    const err = new Error("Notification not found");
    err.status = 404;
    throw err;
  }
  if (n.userId !== userId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }
  return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}

export async function markAllAsRead(userId) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return { message: "All notifications marked as read" };
}
