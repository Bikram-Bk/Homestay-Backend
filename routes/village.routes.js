import { Router } from "express";
import * as villageController from "../controllers/village.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createVillageGuideSchema, updateVillageGuideSchema } from "../validators/village.validator.js";

const router = Router();

// Public routes
router.get("/", villageController.getVillages);
router.get("/guides", villageController.getAllVillageGuides);
router.get("/:villageName/guide", villageController.getVillageGuideByName);

// Admin-only management routes
router.post(
  "/guides",
  authRequired,
  requireRole("ADMIN"),
  validate(createVillageGuideSchema),
  villageController.createVillageGuide
);

router.put(
  "/guides/:id",
  authRequired,
  requireRole("ADMIN"),
  validate(updateVillageGuideSchema),
  villageController.updateVillageGuide
);

router.delete(
  "/guides/:id",
  authRequired,
  requireRole("ADMIN"),
  villageController.deleteVillageGuide
);

export default router;
