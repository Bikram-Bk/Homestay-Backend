import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import * as reviewService from "../services/review.service.js";

// POST /api/reviews
export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  return ok(res, review, "Review submitted successfully", 201);
});

// GET /api/reviews/homestay/:homestayId
export const getHomestayReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getHomestayReviews(req.params.homestayId, req.query);
  return ok(res, result.reviews, "Reviews fetched", 200, {
    averageRating: result.averageRating,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
});

// GET /api/reviews/reviewable
export const getReviewableBookings = asyncHandler(async (req, res) => {
  const bookings = await reviewService.getReviewableBookings(req.user.id);
  return ok(res, bookings, "Reviewable bookings fetched");
});

// GET /api/reviews/my
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getMyReviews(req.user.id);
  return ok(res, reviews, "User reviews fetched");
});
