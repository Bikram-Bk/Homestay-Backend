import { z } from "zod";

const futureDateString = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format. Use YYYY-MM-DD",
  })
  .refine(
    (val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "Date must be today or in the future" }
  );


export const createBookingSchema = z
  .object({
    homestayId: z
      .string({ required_error: "homestayId is required" })
      .min(1, "homestayId cannot be empty"),

    checkIn: futureDateString,

    checkOut: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format. Use YYYY-MM-DD",
      }),

    guests: z
      .number({ required_error: "guests is required", invalid_type_error: "guests must be a number" })
      .int("guests must be a whole number")
      .min(1, "Minimum 1 guest required")
      .max(20, "Maximum 20 guests allowed"),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      return checkOut > checkIn;
    },
    {
      message: "checkOut must be after checkIn",
      path: ["checkOut"],
    }
  );


export const cancelBookingSchema = z.object({
  cancelNote: z
    .string()
    .max(500, "Cancel note cannot exceed 500 characters")
    .optional(),
});


export const availabilityQuerySchema = z
  .object({
    checkIn: z
      .string({ required_error: "checkIn is required" })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid checkIn date. Use YYYY-MM-DD",
      }),
    checkOut: z
      .string({ required_error: "checkOut is required" })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid checkOut date. Use YYYY-MM-DD",
      }),
  })
  .refine(
    (data) => new Date(data.checkOut) > new Date(data.checkIn),
    {
      message: "checkOut must be after checkIn",
      path: ["checkOut"],
    }
  );
