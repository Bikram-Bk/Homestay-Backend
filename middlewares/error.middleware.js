import { fail } from "../utils/response.js";

export function notFound(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

export function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (err.name === "ZodError") {
    return fail(res, "Validation failed", 422, err.errors);
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return fail(res, "Invalid or expired token", 401);
  }

  if (err.code === "P2002") {
    return fail(res, "Duplicate entry", 409);
  }

  if (err.code === "P2025") {
    return fail(res, "Resource not found", 404);
  }

  const status = err.status || 500;
  const message = err.message || "Internal server error";
  return fail(res, message, status);
}
