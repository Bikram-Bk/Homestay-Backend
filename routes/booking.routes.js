import { Router } from "express";
import * as bookingController from "../controllers/booking.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBookingSchema,
  cancelBookingSchema,
  availabilityQuerySchema,
} from "../validators/booking.validator.js";

const router = Router();

// Protected routes (authRequired)
router.post("/", authRequired, validate(createBookingSchema), bookingController.createBooking);
router.get("/my", authRequired, bookingController.getMyBookings);
router.get("/:id", authRequired, bookingController.getBookingById);
router.patch(
  "/:id/cancel",
  authRequired,
  validate(cancelBookingSchema),
  bookingController.cancelBooking
);

export default router;
