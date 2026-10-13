import { z } from "zod";

export const createHomestaySchema = z.object({
  name: z.string().min(3, "Homestay name must be at least 3 characters").max(100),
  description: z.string().max(2000).optional(),
  hostName: z.string().min(2, "Host name is required"),
  hostBio: z.string().max(1000).optional(),
  hostPhoto: z.string().url("Host photo must be a valid URL").optional().or(z.literal("")),
  village: z.string().min(2, "Village name is required"),
  region: z.string().min(2, "Region is required"),
  roomType: z.enum(["PRIVATE", "SHARED", "FAMILY"]).default("PRIVATE"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  mealsIncluded: z.enum(["BREAKFAST", "BREAKFAST_DINNER", "ALL_MEALS"]).default("BREAKFAST"),
  facilities: z.array(z.string()).default([]),
  pricePerNight: z.coerce.number().int().min(100, "Price per night must be at least NPR 100"),
  images: z.array(z.string().url()).default([]),
});

export const updateHomestaySchema = createHomestaySchema.partial();
