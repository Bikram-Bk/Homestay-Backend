import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

// All routes require ADMIN role
router.use(authRequired, requireRole("ADMIN"));

// Stats
router.get("/stats", adminController.getStats);

// Bookings
router.get("/bookings", adminController.getAllBookings);
router.patch("/bookings/:id/confirm", adminController.confirmBooking);

// Users
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.delete("/users/:id", adminController.deleteUser);

// Reviews
router.get("/reviews", adminController.getAllReviews);
router.delete("/reviews/:id", adminController.deleteReview);

export default router;
