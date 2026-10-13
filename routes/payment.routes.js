import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/esewa/initiate", authRequired, paymentController.initiateEsewa);
router.post("/esewa/verify", authRequired, paymentController.verifyEsewa);

export default router;
