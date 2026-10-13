import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordOtpSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", authRequired, authController.logoutAll);
router.get("/me", authRequired, authController.me);
router.patch("/me", authRequired, authController.updateMe);
router.patch("/change-password", authRequired, authController.changePassword);

// Password recovery & OTP routes
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/reset-password", validate(resetPasswordOtpSchema), authController.resetPassword);

export default router;
