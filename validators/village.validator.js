import { z } from "zod";

export const createVillageGuideSchema = z.object({
  village: z.string().min(2, "Village name is required"),
  region: z.string().min(2, "Region is required"),
  content: z.string().min(20, "Guide content must be at least 20 characters"),
  tags: z.array(z.string()).default([]),
});

export const updateVillageGuideSchema = createVillageGuideSchema.partial();
