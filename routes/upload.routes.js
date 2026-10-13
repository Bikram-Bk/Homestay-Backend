import { Router } from "express";
import { upload } from "../middlewares/upload.middleware.js";
import { uploadBuffer, cloudinaryConfigured } from "../config/cloudinary.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { ok, fail } from "../utils/response.js";

const router = Router();

// POST /api/uploads — admin only, field name "images" (max 5 files)
router.post(
  "/",
  authRequired,
  requireRole("ADMIN"),
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (!cloudinaryConfigured) {
        return fail(res, "Cloudinary is not configured on the server", 503);
      }
      if (!req.files || req.files.length === 0) {
        return fail(res, "No files uploaded. Use form-data field 'images'.", 400);
      }

      const results = await Promise.all(
        req.files.map((f) => uploadBuffer(f.buffer, "homestaynepal/homestays")),
      );

      const urls = results.map((r) => r.secure_url);
      return ok(res, { urls }, "Images uploaded successfully", 201);
    } catch (err) {
      return fail(res, err.message || "Upload failed", 500);
    }
  },
);

export default router;
