import crypto from "crypto";
import prisma from "../config/database.js";
import env from "../config/env.js";


export async function createRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString("hex");

  const expiresAt = new Date();
  const days = parseInt(env.REFRESH_TOKEN_EXPIRES) || 7;
  expiresAt.setDate(expiresAt.getDate() + days);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return { token, expiresAt };
}


export async function findRefreshToken(token) {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
}


export async function revokeRefreshToken(token) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}


export async function revokeAllRefreshTokens(userId) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
