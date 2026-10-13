import { Router } from "express";
import * as contactController from "../controllers/contact.controller.js";

const router = Router();

router.post("/booking-request", contactController.bookingRequest);
router.post("/interested", contactController.interestedCandidate);

export default router;
