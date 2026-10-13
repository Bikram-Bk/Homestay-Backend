import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import * as homestayService from "../services/homestay.service.js";

// GET /api/homestays
export const getAllHomestays = asyncHandler(async (req, res) => {
  const result = await homestayService.listHomestays(req.query);
  return ok(res, result.items, "Homestays fetched successfully", 200, result.meta);
});

// GET /api/homestays/:slugOrId
export const getHomestayDetail = asyncHandler(async (req, res) => {
  const { slugOrId } = req.params;
  const homestay = await homestayService.getHomestayBySlugOrId(slugOrId);

  if (!homestay) {
    return fail(res, "Homestay not found", 404);
  }

  return ok(res, homestay, "Homestay details fetched successfully");
});

// POST /api/homestays (Admin)
export const createHomestay = asyncHandler(async (req, res) => {
  const newHomestay = await homestayService.createHomestay(req.body);
  return ok(res, newHomestay, "Homestay created successfully", 201);
});

// PUT /api/homestays/:id (Admin)
export const updateHomestay = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await homestayService.updateHomestay(id, req.body);

  if (!updated) {
    return fail(res, "Homestay not found", 404);
  }

  return ok(res, updated, "Homestay updated successfully");
});

// DELETE /api/homestays/:id (Admin)
export const deleteHomestay = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await homestayService.deleteHomestay(id);
  return ok(res, null, "Homestay deleted successfully");
});
