import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import * as paymentService from "../services/payment.service.js";

// POST /api/payments/esewa/initiate (auth)
export const initiateEsewa = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    const err = new Error("bookingId is required");
    err.status = 400;
    throw err;
  }
  const payload = await paymentService.initiateEsewaPayment(bookingId, req.user.id);
  return ok(res, payload, "eSewa payment initiated");
});

// POST /api/payments/esewa/verify (auth)
export const verifyEsewa = asyncHandler(async (req, res) => {
  const { data } = req.body;
  if (!data) {
    const err = new Error("Payment verification data is required");
    err.status = 400;
    throw err;
  }
  const booking = await paymentService.verifyEsewaPayment(data, req.user.id, req.user.role);
  return ok(res, booking, "Payment verified successfully");
});
