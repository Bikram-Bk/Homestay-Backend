import { Queue, Worker } from "bullmq";
import env from "./env.js";
import prisma from "./database.js";
import {
  sendWelcomeEmail,
  sendPasswordResetOtpEmail,
  sendBookingRequestEmail,
  sendInterestedCandidateEmail,
  sendBookingCreatedEmail,
  sendPaymentConfirmedEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
} from "../services/email.service.js";

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  tls: env.REDIS_TLS === "true" ? {} : undefined,
};

// Queue: jobs that expire unpaid bookings
export const bookingQueue = new Queue("booking-expiry", { connection });

// 10 minutes in ms — how long a PENDING booking may live unpaid
export const BOOKING_EXPIRY_MS = 10 * 60 * 1000;
// export const BOOKING_EXPIRY_MS = 60 * 1000;

//Auto Cancelling Scheduling
export async function scheduleBookingExpiry(bookingId) {
  try {
    await bookingQueue.add(
      "expire-booking",
      { bookingId },
      {
        jobId: `expire-${bookingId}`,
        delay: BOOKING_EXPIRY_MS,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
    console.log(`[queue] Expiry job scheduled for booking ${bookingId}`);
  } catch (err) {
    console.warn(
      `[queue] Failed to schedule expiry for ${bookingId}:`,
      err.message,
    );
  }
}

//Canceling the scheduled expiry job
export async function cancelBookingExpiry(bookingId) {
  try {
    const job = await bookingQueue.getJob(`expire-${bookingId}`);
    if (job) await job.remove();
    console.log(`[queue] Expiry job removed for booking ${bookingId}`);
  } catch (err) {
    console.warn(
      `[queue] Failed to remove expiry job for ${bookingId}:`,
      err.message,
    );
  }
}

//Worker: cancels the booking if still unpaid
export const bookingExpiryWorker = new Worker(
  "booking-expiry",
  async (job) => {
    const { bookingId } = job.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { email: true, name: true } },
        homestay: { select: { name: true } },
      },
    });
    if (!booking) return;

    // Only cancel if payment never happened
    if (booking.status !== "PENDING") return;

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelNote: "Auto-cancelled: payment not received within 10 minutes.",
      },
    });
    console.log(
      `[queue] Booking ${bookingId} auto-cancelled (unpaid > 10 min)`,
    );

    // Send cancellation email to traveler
    if (booking.user && booking.homestay) {
      await enqueueEmail("bookingCancelled", {
        toEmail: booking.user.email,
        userName: booking.user.name,
        homestayName: booking.homestay.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        reason:
          "Payment not received within 10 minutes. Your reserved dates have been released.",
      });
    }
  },
  { connection },
);

bookingExpiryWorker.on("failed", (job, err) => {
  console.warn(
    `[queue] Expiry job failed for ${job?.data?.bookingId}:`,
    err.message,
  );
});

//Queue + Worker: email delivery in background
export const emailQueue = new Queue("email", { connection });

//Enqueue an email job
export async function enqueueEmail(type, payload) {
  try {
    await emailQueue.add(type, payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    });
    console.log(`[queue] Email job "${type}" queued`);
  } catch (err) {
    console.warn(`[queue] Failed to queue email "${type}":`, err.message);
  }
}

export const emailWorker = new Worker(
  "email",
  async (job) => {
    switch (job.name) {
      case "welcome":
        return sendWelcomeEmail(job.data.toEmail, job.data.userName);
      case "otp":
        return sendPasswordResetOtpEmail(
          job.data.toEmail,
          job.data.userName,
          job.data.otp,
        );
      case "bookingRequest":
        return sendBookingRequestEmail(job.data);
      case "interestedCandidate":
        return sendInterestedCandidateEmail(job.data);
      case "bookingCreated":
        return sendBookingCreatedEmail(job.data);
      case "paymentConfirmed":
        return sendPaymentConfirmedEmail(job.data);
      case "bookingConfirmed":
        return sendBookingConfirmedEmail(job.data);
      case "bookingCancelled":
        return sendBookingCancelledEmail(job.data);
      default:
        console.warn(`[queue] Unknown email job type: ${job.name}`);
    }
  },
  { connection },
);

emailWorker.on("failed", (job, err) => {
  console.warn(
    `[queue] Email job "${job?.name}" failed (attempt ${job?.attemptsMade}):`,
    err.message,
  );
});
