import { verifyToken } from "../utils/jwt.js";
import { fail } from "../utils/response.js";
import prisma from "../config/database.js";

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return fail(res, "Authentication required", 401);
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user) return fail(res, "User not found", 401);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
