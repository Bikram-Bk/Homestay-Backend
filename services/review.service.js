import prisma from "../config/database.js";

export async function createReview(userId, data) {
  const { bookingId, rating, comment } = data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }

  if (booking.userId !== userId) {
    const err = new Error("You can only review your own bookings.");
    err.status = 403;
    throw err;
  }

  const eligibleStatuses = ["PAID", "CONFIRMED"];
  if (!eligibleStatuses.includes(booking.status)) {
    const err = new Error(
      `You can only review completed (paid/confirmed) stays. Current status: ${booking.status}`
    );
    err.status = 400;
    throw err;
  }

  if (new Date(booking.checkOut) > new Date()) {
    const err = new Error("You can review only after your stay has ended.");
    err.status = 400;
    throw err;
  }

  if (booking.review) {
    const err = new Error("You have already reviewed this booking.");
    err.status = 409;
    throw err;
  }

  const review = await prisma.review.create({
    data: {
      homestayId: booking.homestayId,
      userId,
      bookingId,
      rating,
      comment: comment || null,
    },
    include: {
      user: { select: { id: true, name: true } },
      homestay: { select: { id: true, name: true, slug: true } },
    },
  });

  return review;
}


export async function getHomestayReviews(homestayId, query = {}) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 10);
  const skip = (page - 1) * limit;

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { homestayId } }),
    prisma.review.findMany({
      where: { homestayId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const avg = reviews.length
    ? await prisma.review.aggregate({
        where: { homestayId },
        _avg: { rating: true },
      })
    : { _avg: { rating: null } };

  return {
    reviews,
    averageRating: avg._avg.rating ? parseFloat(avg._avg.rating.toFixed(1)) : null,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getReviewableBookings(userId) {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      status: { in: ["PAID", "CONFIRMED"] },
      checkOut: { lt: new Date() },
      review: null,
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      guests: true,
      homestay: { select: { id: true, name: true, slug: true, images: true } },
    },
    orderBy: { checkOut: "desc" },
  });
  return bookings;
}


export async function getMyReviews(userId) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      homestay: {
        select: {
          id: true,
          name: true,
          slug: true,
          village: true,
          region: true,
          images: true,
        },
      },
      booking: {
        select: {
          checkIn: true,
          checkOut: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return reviews;
}
