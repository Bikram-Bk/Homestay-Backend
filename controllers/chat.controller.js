import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import * as chatService from "../services/chat.service.js";
import { indexHomestay } from "../rag/retriever.js";

// POST /api/chat/message
export const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body || {};
  const result = await chatService.chatMessage(req.user.id, { message, sessionId });
  return ok(res, result, "Message sent");
});

// POST /api/chat/sessions
export const createSession = asyncHandler(async (req, res) => {
  const session = await chatService.createChatSession(req.user.id, req.body?.title);
  return ok(res, session, "Session created", 201);
});

// GET /api/chat/sessions
export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await chatService.getUserSessions(req.user.id);
  return ok(res, sessions, "Sessions fetched");
});

// GET /api/chat/sessions/:id
export const getSession = asyncHandler(async (req, res) => {
  const messages = await chatService.getSessionMessages(req.params.id, req.user.id);
  return ok(res, messages, "Messages fetched");
});

// DELETE /api/chat/sessions/:id
export const deleteSession = asyncHandler(async (req, res) => {
  await chatService.deleteSession(req.params.id, req.user.id);
  return ok(res, null, "Session deleted");
});

// POST /api/chat/index/:homestayId (admin)
export const indexOne = asyncHandler(async (req, res) => {
  await indexHomestay(req.params.homestayId);
  return ok(res, null, "Homestay indexed");
});
