import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import * as authService from "../services/auth.service.js";
import env from "../config/env.js";


const REFRESH_COOKIE_NAME = "hn_refresh_token";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};


export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

  return ok(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    "User registered",
    201,
  );
});


// Login

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

  return ok(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    "Login success",
  );
});

// Refresh — new refresh token generation
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  const result = await authService.refresh(token);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);

  return ok(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    "Token refreshed",
  );
});

const clearCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/api/auth",
};

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  await authService.logout(token);

  res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions);

  return ok(res, null, "Logged out");
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);

  res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions);

  return ok(res, null, "Logged out from all devices");
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  return ok(res, user, "User fetched");
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body || {};
  const user = await authService.updateMe(req.user.id, { name, phone });
  return ok(res, user, "Profile updated successfully");
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return fail(res, "Current password and new password are required", 400);
  }
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  return ok(res, null, "Password changed successfully");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  return ok(res, result, result.message);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOtp(email, otp);
  return ok(res, result, result.message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await authService.resetPassword(email, otp, newPassword);
  return ok(res, result, result.message);
});
