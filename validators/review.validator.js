import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z
    .string({ required_error: "bookingId is required" })
    .min(1, "bookingId cannot be empty"),

  rating: z
    .number({ required_error: "rating is required", invalid_type_error: "rating must be a number" })
    .int("rating must be a whole number")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),

  comment: z
    .string()
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
});
