import { CohereClient } from "cohere-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "../config/env.js";

let cohere = null;
let gemini = null;

if (env.COHERE_API_KEY) {
  cohere = new CohereClient({ token: env.COHERE_API_KEY });
  console.log("[cohere] Client initialized.");
} else {
  console.warn("[cohere] COHERE_API_KEY not set — embeddings will use Gemini fallback.");
}

if (env.GEMINI_API_KEY) {
  gemini = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  console.log("[gemini] Client initialized.");
} else {
  console.warn("[gemini] GEMINI_API_KEY not set — AI fallback disabled.");
}

export function formatHomestayForEmbedding(homestay, guide) {
  return `
Name: ${homestay.name}
Village: ${homestay.village}
Region: ${homestay.region}
Type: ${homestay.roomType}
Price per night: NPR ${homestay.pricePerNight}
Capacity: ${homestay.capacity} guests
Meals included: ${homestay.mealsIncluded}
Facilities: ${(homestay.facilities || []).join(", ")}
Description: ${homestay.description || ""}
Host: ${homestay.hostName} — ${homestay.hostBio || ""}
${guide ? `Village guide: ${guide.content}` : ""}
`.trim();
}

export async function generateEmbedding(text, inputType = "search_document") {
  try {
    if (!cohere) throw new Error("Cohere not configured");
    const res = await cohere.embed({
      texts: [text],
      model: "embed-english-v3.0",
      inputType,
    });
    return { vector: res.embeddings[0], provider: "cohere" };
  } catch (err) {
    console.warn(`[AI Fallback] Cohere failed, switching to Gemini: ${err.message}`);
    if (!gemini) throw new Error(`Cohere failed and Gemini is not configured: ${err.message}`);
    const model = gemini.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return { vector: result.embedding.values, provider: "gemini" };
  }
}

export async function embedText(text, inputType = "search_document") {
  const { vector } = await generateEmbedding(text, inputType);
  return vector;
}
