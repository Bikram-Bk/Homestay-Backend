import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import * as notificationService from "../services/notification.service.js";

// GET /api/notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getMyNotifications(req.user.id, req.query);
  return ok(res, result.notifications, "Notifications fetched", 200, {
    unread: result.unread,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
});

// PATCH /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const n = await notificationService.markAsRead(req.user.id, req.params.id);
  return ok(res, n, "Marked as read");
});

// PATCH /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  return ok(res, null, "All notifications marked as read");
});
