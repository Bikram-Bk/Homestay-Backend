import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../config/database.js";
import env from "../config/env.js";
import { searchHomestays } from "../rag/retriever.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../rag/prompt.js";

let groq = null;
let gemini = null;
if (env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: env.GROQ_API_KEY });
  console.log("[groq] Client initialized.");
} else {
  console.warn("[groq] GROQ_API_KEY not set — chat answers will be mocked.");
}
if (env.GEMINI_API_KEY) {
  gemini = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  console.log("[gemini] Client initialized.");
}

// ── Intent detection ──
const SEARCH_KEYWORDS = [
  "find", "looking for", "search", "homestay", "stay", "room", "village",
  "trek", "hiking", "ghandruk", "bandipur", "sirubari", "nagarkot",
  "chitwan", "tansen", "palpa", "pokhara", "book", "available", "price",
  "family", "private", "shared", "meal", "breakfast", "dinner",
];
const HELP_KEYWORDS = ["how to", "how do", "how can", "what is", "create", "make", "cancel", "payment", "esewa", "review", "login", "register", "account"];

function detectIntent(message) {
  const m = message.toLowerCase();
  if (HELP_KEYWORDS.some((k) => m.includes(k))) return "help";
  if (SEARCH_KEYWORDS.some((k) => m.includes(k))) return "search";
  return "general";
}

const APP_GUIDE = `
Useful app info:
• Register/Login: /register or /login — use your email and password.
• Browse homestays: /homestays — filter by village, price, meals, room type.
• Book: open a homestay, click "Book Now", pick dates, guests → booking becomes PENDING.
• Pay: go to your dashboard → click "Pay with eSewa" → complete on the eSewa gateway.
• Note: unpaid PENDING bookings auto-cancel after 10 minutes.
• Cancel: dashboard → "Cancel Reservation" (paid bookings cannot be cancelled directly).
• Review: after your stay ends, open the booking card on your dashboard → "Write a Review".
`.trim();

export async function createChatSession(userId, title) {
  return prisma.chatSession.create({ data: { userId, title: title || "HomestayNepal chat" } });
}

export async function getUserSessions(userId) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
}

export async function getSessionMessages(sessionId, userId) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) {
    const err = new Error("Session not found or access denied");
    err.status = 404;
    throw err;
  }
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteSession(sessionId, userId) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) {
    const err = new Error("Session not found or access denied");
    err.status = 404;
    throw err;
  }
  await prisma.chatSession.delete({ where: { id: sessionId } });
  return true;
}

export async function chatMessage(userId, { message, sessionId }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    const err = new Error("message is required");
    err.status = 400;
    throw err;
  }

  let session;
  if (sessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      const err = new Error("Invalid session");
      err.status = 404;
      throw err;
    }
  } else {
    session = await createChatSession(userId, message.slice(0, 40));
  }

  await prisma.chatMessage.create({ data: { sessionId: session.id, role: "user", content: message } });

  const intent = detectIntent(message);
  let homestays = [];
  let contextText = "";

  if (intent === "search" || intent === "general") {
    try {
      homestays = await searchHomestays(message, 5);
      if (homestays.length > 0) {
        contextText = homestays
          .map((h, i) => `${i + 1}. ${h.name} — ${h.village}, ${h.region} | NPR ${h.pricePerNight}/night | ${h.roomType} | capacity ${h.capacity}`)
          .join("\n");
      }
    } catch (err) {
      console.warn("[rag] search failed:", err.message);
    }
  }

  if (intent === "help") {
    contextText = APP_GUIDE;
  }

  const recent = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const historyText = recent
    .reverse()
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  let answer;
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(message, contextText, historyText) },
        ],
      });
      answer = completion.choices[0]?.message?.content?.trim() || "Sorry, I could not generate an answer.";
    } catch (err) {
      console.warn(`[AI Fallback] Groq failed, switching to Google Gemini... (${err.message})`);
      try {
        if (!gemini) throw new Error("Gemini not configured");
        const model = gemini.getGenerativeModel({
          model: "gemini-3.8-flash",
          systemInstruction: SYSTEM_PROMPT,
        });
        // Convert Groq/OpenAI-style history to Gemini history
        const geminiHistory = recent
          .reverse()
          .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
        const chat = model.startChat({ history: geminiHistory.slice(0, -1) });
        const result = await chat.sendMessage(buildUserPrompt(message, contextText, historyText));
        answer = result.response.text().trim() || "Sorry, I could not generate an answer.";
      } catch (err2) {
        console.warn("[gemini] inference failed:", err2.message);
        answer = `I found some relevant homestays:\n${contextText || "No specific matches."}`;
      }
    }
  } else {
    try {
      if (!gemini) throw new Error("Gemini not configured");
      const model = gemini.getGenerativeModel({
        model: "gemini-3.8-flash",
        systemInstruction: SYSTEM_PROMPT,
      });
      const geminiHistory = recent
        .reverse()
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const chat = model.startChat({ history: geminiHistory.slice(0, -1) });
      const result = await chat.sendMessage(buildUserPrompt(message, contextText, historyText));
      answer = result.response.text().trim() || "Sorry, I could not generate an answer.";
    } catch {
      answer = `(DEV MODE — no GROQ_API_KEY) I could answer based on these homestays:\n${contextText || "none"}`;
    }
  }

  await prisma.chatMessage.create({ data: { sessionId: session.id, role: "assistant", content: answer } });

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { updatedAt: new Date(), title: session.title || message.slice(0, 40) },
  });

  return { sessionId: session.id, response: answer, homestays };
}
