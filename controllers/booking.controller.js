import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import * as bookingService from "../services/booking.service.js";


// Create a new booking (Auth required)
export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);
  return ok(res, booking, "Booking created successfully", 201);
});

// Get logged-in user's bookings
export const getMyBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getMyBookings(req.user.id, req.query);
  return ok(res, result.bookings, "Bookings fetched", 200, result.meta);
});

// Get single booking detail (owner or admin)
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(
    req.params.id,
    req.user.id,
    req.user.role
  );
  return ok(res, booking, "Booking fetched");
});

// Cancel a booking (owner or admin)
export const cancelBooking = asyncHandler(async (req, res) => {
  const { cancelNote } = req.body;
  const booking = await bookingService.cancelBooking(
    req.params.id,
    req.user.id,
    req.user.role,
    cancelNote
  );
  return ok(res, booking, "Booking cancelled successfully");
});

// Check date availability 
export const checkAvailability = asyncHandler(async (req, res) => {
  const { checkIn, checkOut } = req.validatedQuery;
  const result = await bookingService.checkAvailability(
    req.params.id,
    checkIn,
    checkOut
  );
  return ok(res, result, result.available ? "Dates are available" : "Dates are not available");
});
