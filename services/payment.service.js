import prisma from "../config/database.js";
import env from "../config/env.js";
import { generateEsewaSignature, decodeEsewaData } from "../utils/esewa.js";
import { cancelBookingExpiry, enqueueEmail } from "../config/queue.js";
import { createNotification } from "./notification.service.js";


export async function initiateEsewaPayment(bookingId, userId, clientOrigin) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    const err = new Error("Booking not found");
    err.status = 404;
    throw err;
  }

  if (booking.userId !== userId) {
    const err = new Error("Access denied. This booking does not belong to you.");
    err.status = 403;
    throw err;
  }

  if (booking.status !== "PENDING") {
    const err = new Error(`Booking is already ${booking.status}. Only pending bookings can be paid.`);
    err.status = 400;
    throw err;
  }

  const total_amount = Number(booking.totalAmount).toFixed(2);
  const transaction_uuid = `${booking.id}-${Date.now()}`;
  const product_code = env.ESEWA_PRODUCT_CODE;

  const signature = generateEsewaSignature(
    { total_amount, transaction_uuid, product_code },
    env.ESEWA_SECRET_KEY
  );

  const baseUrl = clientOrigin ? clientOrigin.replace(/\/+$/, "") : env.FRONTEND_URL;

  return {
    gatewayUrl: env.ESEWA_GATEWAY_URL,
    amount: total_amount,
    tax_amount: "0",
    total_amount,
    transaction_uuid,
    product_code,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: `${baseUrl}/payment/esewa/success`,
    failure_url: `${baseUrl}/payment/esewa/failure`,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature,
  };
}


export async function verifyEsewaPayment(encodedData, userId, userRole) {
  const decoded = decodeEsewaData(encodedData);

  if (!decoded) {
    const err = new Error("Invalid payment verification data");
    err.status = 400;
    throw err;
  }

  const { transaction_code, status, total_amount, transaction_uuid } = decoded;

  if (!transaction_uuid || !total_amount) {
    const err = new Error("Incomplete payment verification data");
    err.status = 400;
    throw err;
  }

  // Booking id is everything before the first "-" timestamp suffix we added
  const bookingId = transaction_uuid.split("-").slice(0, -1).join("-") || transaction_uuid;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    const err = new Error("Booking not found for this payment");
    err.status = 404;
    throw err;
  }

  if (booking.userId !== userId && userRole !== "ADMIN") {
    const err = new Error("Access denied.");
    err.status = 403;
    throw err;
  }

  // Confirm with eSewa Status Check API
  const cleanTotalAmount = String(total_amount).replace(/,/g, "");
  const statusUrl = `${env.ESEWA_STATUS_CHECK_URL}?product_code=${env.ESEWA_PRODUCT_CODE}&total_amount=${cleanTotalAmount}&transaction_uuid=${transaction_uuid}`;

  let esewaStatus = status;
  try {
    const res = await fetch(statusUrl);
    const json = await res.json();
    esewaStatus = json?.status || status;
  } catch (err) {
    console.warn(`[esewa] Status check API failed, falling back to callback status: ${err.message}`);
  }

  if (esewaStatus !== "COMPLETE") {
    const err = new Error(`Payment not completed. eSewa status: ${esewaStatus}`);
    err.status = 400;
    throw err;
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "PAID", paymentRef: transaction_code || transaction_uuid },
    include: {
      homestay: {
        select: {
          id: true,
          name: true,
          slug: true,
          village: true,
          region: true,
          images: true,
        },
      },
    },
  });

  // Payment received — remove the auto-expiry job
  await cancelBookingExpiry(booking.id);

  // Notify the traveler
  await createNotification(
    booking.userId,
    "Payment Successful",
    `Payment of NPR ${booking.totalAmount.toLocaleString()} for ${updated.homestay?.name || "your booking"} was received. Waiting for admin confirmation.`
  );

  // Send payment confirmed email
  const user = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true, name: true } });
  if (user) {
    await enqueueEmail("paymentConfirmed", {
      toEmail: user.email,
      userName: user.name,
      homestayName: updated.homestay?.name || "your homestay",
      village: updated.homestay?.village || "",
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      guests: updated.guests,
      totalAmount: updated.totalAmount,
      paymentRef: transaction_code || transaction_uuid,
    });
  }

  return updated;
}
