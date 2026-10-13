import prisma from "../config/database.js";
import { acquireLock, releaseLock } from "../utils/lock.js";
import { scheduleBookingExpiry, cancelBookingExpiry, enqueueEmail } from "../config/queue.js";
import { createNotification } from "./notification.service.js";
import { getPaginationParams, formatPaginationMeta } from "../utils/pagination.js";

// Helper: compute nights between two date strings
function computeNights(checkIn, checkOut) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / msPerDay);
}

// Create Booking
export async function createBooking(userId, data) {
  const { homestayId, checkIn, checkOut, guests } = data;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // 1. Verify homestay exists
  const homestay = await prisma.homestay.findUnique({
    where: { id: homestayId },
  });
  if (!homestay) {
    const err = new Error("Homestay not found");
    err.status = 404;
    throw err;
  }

  // 2. Guests vs capacity check
  if (guests > homestay.capacity) {
    const err = new Error(
      `Guest count (${guests}) exceeds homestay capacity (${homestay.capacity})`
    );
    err.status = 400;
    throw err;
  }

  // 3. Acquire Redis lock to prevent race conditions
  const lockKey = `lock:booking:${homestayId}:${checkIn}:${checkOut}`;
  const locked = await acquireLock(lockKey, 8000); // 8 second TTL
  if (!locked) {
    const err = new Error(
      "Someone else is booking these dates right now. Please try again in a moment."
    );
    err.status = 409;
    throw err;
  }

  try {
    // 4. Check date overlap with existing ACTIVE bookings
    const overlap = await prisma.booking.findFirst({
      where: {
        homestayId,
        status: { notIn: ["CANCELLED"] },
        // Overlap condition: existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });

    if (overlap) {
      const err = new Error(
        "These dates are already booked. Please choose different dates."
      );
      err.status = 409;
      throw err;
    }

    // 5. Calculate total amount
    const nights = computeNights(checkIn, checkOut);
    const totalAmount = nights * homestay.pricePerNight;

    // 6. Create booking (status = PENDING)
    const booking = await prisma.booking.create({
      data: {
        homestayId,
        userId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalAmount,
        status: "PENDING",
      },
      include: {
        homestay: {
          select: {
            id: true,
            name: true,
            slug: true,
            village: true,
            region: true,
            pricePerNight: true,
            images: true,
            hostName: true,
          },
        },
      },
    });

    // 7. Schedule auto-cancellation if left unpaid
    await scheduleBookingExpiry(booking.id);

    // 8. Notify the traveler (in-app)
    await createNotification(
      userId,
      "Booking Created",
      `Your booking at ${homestay.name} (${checkIn} → ${checkOut}) is pending. Please pay within 10 minutes to confirm your dates.`
    );

    // 9. Send booking created email
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (user) {
      await enqueueEmail("bookingCreated", {
        toEmail: user.email,
        userName: user.name,
        homestayName: homestay.name,
        village: homestay.village || "",
        checkIn,
        checkOut,
        guests,
        totalAmount: booking.totalAmount,
        bookingId: booking.id,
      });
    }

    return {
      ...booking,
      nights,
    };
  } finally {
    // Always release the lock, even on error
    await releaseLock(lockKey);
  }
}

// Get My Bookings
export async function getMyBookings(userId, query) {
  const { status } = query;
  const { page, limit, skip } = getPaginationParams(query);

  const where = { userId };

  // Optional status filter
  const validStatuses = ["PENDING", "PAID", "CONFIRMED", "CANCELLED"];
  if (status && validStatuses.includes(status.toUpperCase())) {
    where.status = status.toUpperCase();
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        homestay: {
          select: {
            id: true,
            name: true,
            slug: true,
            village: true,
            region: true,
            pricePerNight: true,
            images: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          },
        },
      },
    }),
  ]);

  return {
    bookings,
    meta: formatPaginationMeta(total, page, limit),
  };
}

// Get Single Booking by ID
export async function getBookingById(bookingId, userId, userRole) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      homestay: {
        select: {
          id: true,
          name: true,
          slug: true,
          village: true,
          region: true,
          pricePerNight: true,
          images: true,
          hostName: true,
          hostBio: true,
          facilities: true,
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }

  // Only owner or admin can view
  if (booking.userId !== userId && userRole !== "ADMIN") {
    const err = new Error("Access denied. This booking does not belong to you.");
    err.status = 403;
    throw err;
  }

  const nights = computeNights(booking.checkIn, booking.checkOut);
  return { ...booking, nights };
}

// Cancel Booking
export async function cancelBooking(bookingId, userId, userRole, cancelNote) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }

  // Only owner or admin can cancel
  if (booking.userId !== userId && userRole !== "ADMIN") {
    const err = new Error("Access denied. This booking does not belong to you.");
    err.status = 403;
    throw err;
  }

  if (booking.status === "CANCELLED") {
    const err = new Error("Booking is already cancelled.");
    err.status = 400;
    throw err;
  }

  if (booking.status === "PAID") {
    const err = new Error(
      "Cannot cancel a paid booking directly. Please contact support."
    );
    err.status = 400;
    throw err;
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelNote: cancelNote || null,
    },
  });

  // Remove the scheduled expiry job — no longer needed
  await cancelBookingExpiry(bookingId);

  // Send cancellation email
  const bookingUser = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true, name: true } });
  const homestay = await prisma.homestay.findUnique({ where: { id: booking.homestayId }, select: { name: true } });
  if (bookingUser && homestay) {
    await enqueueEmail("bookingCancelled", {
      toEmail: bookingUser.email,
      userName: bookingUser.name,
      homestayName: homestay.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      reason: cancelNote || "Cancelled by request.",
    });
  }

  return updated;
}

export async function checkAvailability(homestayId, checkIn, checkOut) {
  // Verify homestay exists
  const homestay = await prisma.homestay.findUnique({
    where: { id: homestayId },
    select: { id: true, name: true, capacity: true, pricePerNight: true },
  });

  if (!homestay) {
    const err = new Error("Homestay not found");
    err.status = 404;
    throw err;
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Fetch ALL overlapping bookings (for calendar visualization)
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      homestayId,
      status: { notIn: ["CANCELLED"] },
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
    select: {
      checkIn: true,
      checkOut: true,
    },
  });

  const conflict = overlappingBookings.length > 0;
  const nights = computeNights(checkIn, checkOut);

  return {
    available: !conflict,
    homestayId,
    checkIn,
    checkOut,
    nights,
    estimatedTotal: !conflict ? nights * homestay.pricePerNight : null,
    pricePerNight: homestay.pricePerNight,
    // All booked ranges in this window — used by the calendar UI
    bookedRanges: overlappingBookings.map((b) => ({
      checkIn: b.checkIn.toISOString(),
      checkOut: b.checkOut.toISOString(),
    })),
  };
}

