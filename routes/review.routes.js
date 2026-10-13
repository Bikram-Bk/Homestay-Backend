import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createReviewSchema } from "../validators/review.validator.js";

const router = Router();

// Public: reviews for a homestay
router.get("/homestay/:homestayId", reviewController.getHomestayReviews);

// Protected
router.get("/my", authRequired, reviewController.getMyReviews);
router.post("/", authRequired, validate(createReviewSchema), reviewController.createReview);
router.get("/reviewable", authRequired, reviewController.getReviewableBookings);

export default router;
