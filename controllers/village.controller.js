import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import * as villageService from "../services/village.service.js";

// GET /api/villages
export const getVillages = asyncHandler(async (req, res) => {
  const villages = await villageService.listVillages();
  return ok(res, villages, "Villages fetched successfully");
});

// GET /api/villages/:villageName/guide
export const getVillageGuideByName = asyncHandler(async (req, res) => {
  const { villageName } = req.params;
  const guide = await villageService.getVillageGuide(villageName);

  if (!guide) {
    return fail(res, "Village guide not found", 404);
  }

  return ok(res, guide, "Village guide fetched successfully");
});

// GET /api/villages/guides (All guides)
export const getAllVillageGuides = asyncHandler(async (req, res) => {
  const guides = await villageService.listVillageGuides();
  return ok(res, guides, "All village guides fetched successfully");
});

// POST /api/villages/guides (Admin)
export const createVillageGuide = asyncHandler(async (req, res) => {
  const newGuide = await villageService.createVillageGuide(req.body);
  return ok(res, newGuide, "Village guide created successfully", 201);
});

// PUT /api/villages/guides/:id (Admin)
export const updateVillageGuide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await villageService.updateVillageGuide(id, req.body);
  return ok(res, updated, "Village guide updated successfully");
});

// DELETE /api/villages/guides/:id (Admin)
export const deleteVillageGuide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await villageService.deleteVillageGuide(id);
  return ok(res, null, "Village guide deleted successfully");
});
