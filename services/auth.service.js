import crypto from "crypto";
import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from "../utils/tokens.js";
import { enqueueEmail } from "../config/queue.js";

// Register
export async function register(data) {
  const { name, email, password, phone } = data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      phone: phone || null,
      role: "TRAVELER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken } = await createRefreshToken(user.id);

  enqueueEmail("welcome", { toEmail: user.email, userName: user.name });

  return { user, accessToken, refreshToken };
}

// Login
export async function login(data) {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken } = await createRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
}

// Refresh — new refresh token
export async function refresh(oldRefreshToken) {
  if (!oldRefreshToken) {
    const err = new Error("Refresh token required");
    err.status = 401;
    throw err;
  }

  const stored = await findRefreshToken(oldRefreshToken);
  if (!stored) {
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }

  if (stored.expiresAt < new Date()) {
    await revokeRefreshToken(oldRefreshToken);
    const err = new Error("Refresh token expired");
    err.status = 401;
    throw err;
  }

  await revokeRefreshToken(oldRefreshToken);
  const { token: newRefreshToken } = await createRefreshToken(stored.userId);

  const accessToken = signAccessToken({
    sub: stored.user.id,
    role: stored.user.role,
  });

  return {
    user: {
      id: stored.user.id,
      name: stored.user.name,
      email: stored.user.email,
      phone: stored.user.phone,
      role: stored.user.role,
    },
    accessToken,
    refreshToken: newRefreshToken,
  };
}

// Logout — current device
export async function logout(refreshToken) {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return { success: true };
}

// Logout all devices
export async function logoutAll(userId) {
  await revokeAllRefreshTokens(userId);
  return { success: true };
}

// Me
export async function me(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return user;
}

// Update Me — update profile details
export async function updateMe(userId, { name, phone }) {
  const data = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof phone === "string") data.phone = phone.trim();

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

// Change Password (logged-in user)
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const matches = await comparePassword(currentPassword, user.password);
  if (!matches) {
    const err = new Error("Current password is incorrect");
    err.status = 400;
    throw err;
  }

  if (!newPassword || newPassword.length < 6) {
    const err = new Error("New password must be at least 6 characters");
    err.status = 400;
    throw err;
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return true;
}

// Forgot Password — Generates & Sends 6-digit OTP
export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      message: "If the email is registered, a 6-digit password reset OTP has been sent.",
    };
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetOtp: hashedOtp,
      resetOtpExpires: expiresAt,
    },
  });

  enqueueEmail("otp", { toEmail: user.email, userName: user.name, otp });

  return {
    message: "If the email is registered, a 6-digit password reset OTP has been sent.",
    devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
  };
}
// Verify 6-digit OTP
export async function verifyOtp(email, otp) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.resetOtp || !user.resetOtpExpires) {
    const err = new Error("Invalid or expired OTP");
    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(user.resetOtpExpires)) {
    const err = new Error("OTP has expired. Please request a new code.");
    err.status = 400;
    throw err;
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedOtp !== user.resetOtp) {
    const err = new Error("Invalid OTP code");
    err.status = 400;
    throw err;
  }

  return {
    valid: true,
    message: "OTP verified successfully. You may now reset your password.",
  };
}

// Reset Password with OTP
export async function resetPassword(email, otp, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.resetOtp || !user.resetOtpExpires) {
    const err = new Error("Invalid or expired password reset request");
    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(user.resetOtpExpires)) {
    const err = new Error("OTP has expired. Please request a new code.");
    err.status = 400;
    throw err;
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedOtp !== user.resetOtp) {
    const err = new Error("Invalid OTP code");
    err.status = 400;
    throw err;
  }

  const hashedPassword = await hashPassword(newPassword);

  // Update password and clear reset OTP tokens
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpires: null,
    },
  });

  // Revoke all existing sessions for security
  await revokeAllRefreshTokens(user.id);

  return {
    success: true,
    message: "Password reset successful! Please log in with your new password.",
  };
}
