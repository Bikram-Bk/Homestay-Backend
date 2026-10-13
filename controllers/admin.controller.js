import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import prisma from "../config/database.js";
import { createNotification } from "../services/notification.service.js";
import { enqueueEmail } from "../config/queue.js";
import { getPaginationParams, formatPaginationMeta } from "../utils/pagination.js";


export const getStats = asyncHandler(async (req, res) => {
  const [
    totalBookings,
    pendingBookings,
    totalHomestays,
    totalUsers,
    revenueResult,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.homestay.count(),
    prisma.user.count({ where: { role: "TRAVELER" } }),
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["PAID", "CONFIRMED"] } },
    }),
  ]);

  return ok(res, {
    totalBookings,
    pendingBookings,
    totalHomestays,
    totalUsers,
    totalRevenue: revenueResult._sum.totalAmount ?? 0,
  }, "Stats fetched");
});


export const getAllBookings = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = getPaginationParams(req.query);

  const where = {};
  if (status && status !== "ALL") where.status = status;
  if (search) {
    where.user = {
      name: { contains: search, mode: "insensitive" },
    };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        homestay: { select: { id: true, name: true, village: true, region: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return ok(res, bookings, "Bookings fetched", 200, formatPaginationMeta(total, page, limit));
});

export const confirmBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return fail(res, "Booking not found", 404);

  if (booking.status !== "PAID") {
    return fail(res, `Cannot confirm booking with status: ${booking.status}`, 400);
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CONFIRMED" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      homestay: { select: { id: true, name: true, village: true } },
    },
  });


  await createNotification(
    updated.user.id,
    "Booking Confirmed",
    `Great news! Your booking at ${updated.homestay?.name || "the homestay"} has been confirmed by the admin. See you soon!`
  );

  await enqueueEmail("bookingConfirmed", {
    toEmail: updated.user.email,
    userName: updated.user.name,
    homestayName: updated.homestay?.name || "your homestay",
    village: updated.homestay?.village || "",
    checkIn: updated.checkIn,
    checkOut: updated.checkOut,
    guests: updated.guests,
    totalAmount: updated.totalAmount,
  });

  return ok(res, updated, "Booking confirmed successfully");
});

export const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const { page, limit, skip } = getPaginationParams(req.query);

  const where = { role: "TRAVELER" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return ok(res, users, "Users fetched", 200, formatPaginationMeta(total, page, limit));
});

// All reviews with user + homestay info
export const getAllReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        homestay: { select: { id: true, name: true, village: true } },
      },
    }),
    prisma.review.count(),
  ]);

  return ok(res, reviews, "Reviews fetched", 200, formatPaginationMeta(total, page, limit));
});

// Delete a review (moderation)
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return fail(res, "Review not found", 404);

  await prisma.review.delete({ where: { id } });
  return ok(res, null, "Review deleted successfully");
});

// Single traveler detail + their booking history
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { bookings: true, reviews: true } },
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          guests: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          homestay: { select: { id: true, name: true, village: true } },
        },
      },
    },
  });

  if (!user) return fail(res, "User not found", 404);
  return ok(res, user, "User detail fetched");
});

// Delete a traveler — CASCADE deletes their bookings,
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  if (!user) return fail(res, "User not found", 404);

  if (user.role === "ADMIN") {
    return fail(res, "Cannot delete an admin account", 403);
  }

  await prisma.user.delete({ where: { id } });

  return ok(
    res,
    {
      deletedBookings: user._count.bookings,
      deletedReviews: user._count.reviews,
    },
    `Traveler "${user.name}" deleted (with ${user._count.bookings} bookings, ${user._count.reviews} reviews)`
  );
});
