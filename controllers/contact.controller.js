import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import { enqueueEmail } from "../config/queue.js";

// POST /api/contact/booking-request
export const bookingRequest = asyncHandler(async (req, res) => {
  const { fullName, email, phone, guests, room, dates, message } = req.body || {};

  if (!fullName || !email) {
    return fail(res, "Full name and email are required", 400);
  }

  enqueueEmail("bookingRequest", { fullName, email, phone, guests, room, dates, message });
  return ok(res, null, "Booking request sent to admin successfully");
});

// POST /api/contact/interested
export const interestedCandidate = asyncHandler(async (req, res) => {
  const { name, email } = req.body || {};

  if (!email) {
    return fail(res, "Email is required", 400);
  }

  enqueueEmail("interestedCandidate", { name, email });
  return ok(res, null, "Subscribed successfully");
});
