import { Router } from "express";
import * as chatController from "../controllers/chat.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/message", authRequired, chatController.sendMessage);
router.post("/sessions", authRequired, chatController.createSession);
router.get("/sessions", authRequired, chatController.listSessions);
router.get("/sessions/:id", authRequired, chatController.getSession);
router.delete("/sessions/:id", authRequired, chatController.deleteSession);
router.post("/index/:homestayId", authRequired, requireRole("ADMIN"), chatController.indexOne);

export default router;
