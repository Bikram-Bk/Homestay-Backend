import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import prisma from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import homestayRoutes from "./routes/homestay.routes.js";
import villageRoutes from "./routes/village.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import "./config/queue.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: [env.FRONTEND_URL, env.ADMIN_URL],
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser(env.COOKIE_SECRET));

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => res.send("okay"));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "ok",
    data: { uptime: process.uptime() },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/homestays", homestayRoutes);
app.use("/api/villages", villageRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

const shutdown = async (signal) => {
  console.log(`\n[server] ${signal} received, shutting down...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("[server] closed");
      process.exit(0);
    } catch (err) {
      console.error("[server] shutdown error:", err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("[server] forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
