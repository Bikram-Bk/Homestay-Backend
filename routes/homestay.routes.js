import { Router } from "express";
import * as homestayController from "../controllers/homestay.controller.js";
import * as bookingController from "../controllers/booking.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createHomestaySchema, updateHomestaySchema } from "../validators/homestay.validator.js";
import { availabilityQuerySchema } from "../validators/booking.validator.js";

const router = Router();

// Public routes
router.get("/", homestayController.getAllHomestays);
router.get("/:id/availability", validate(availabilityQuerySchema, "query"), bookingController.checkAvailability);
router.get("/:slugOrId", homestayController.getHomestayDetail);

// Admin-only management routes
router.post(
  "/",
  authRequired,
  requireRole("ADMIN"),
  validate(createHomestaySchema),
  homestayController.createHomestay
);

router.put(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  validate(updateHomestaySchema),
  homestayController.updateHomestay
);

router.delete(
  "/:id",
  authRequired,
  requireRole("ADMIN"),
  homestayController.deleteHomestay
);

export default router;
