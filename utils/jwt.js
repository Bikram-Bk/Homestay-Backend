import jwt from "jsonwebtoken";
import env from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
