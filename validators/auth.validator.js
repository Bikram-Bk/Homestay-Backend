import { z } from "zod";

// Register
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name minimum 2 chars")
    .max(50, "Name maximum 50 chars"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password minimum 6 chars")
    .max(100, "Password maximum 100 chars"),
  phone: z
    .string()
    .regex(/^(98|97|96)\d{8}$/, "Invalid Nepali phone number")
    .optional()
    .or(z.literal("")),
});

// Login
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Forgot Password Request
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Verify 6-digit OTP
export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain digits only"),
});

// Reset Password with OTP
export const resetPasswordOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain digits only"),
  newPassword: z
    .string()
    .min(6, "New password minimum 6 chars")
    .max(100, "New password maximum 100 chars"),
});
