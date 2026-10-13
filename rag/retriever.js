import prisma from "../config/database.js";
import { generateEmbedding, formatHomestayForEmbedding } from "./embeddings.js";

export async function indexHomestay(homestayId) {
  const homestay = await prisma.homestay.findUnique({
    where: { id: homestayId },
  });
  if (!homestay) return;

  const guide = await prisma.villageGuide.findUnique({
    where: { village: homestay.village },
  });

  const text = formatHomestayForEmbedding(homestay, guide);
  const { vector, provider } = await generateEmbedding(text, "search_document");

  if (provider !== "cohere") {
    console.warn(`[rag] Skipping index for ${homestay.name} — provider was ${provider} (dimension mismatch with Cohere index)`);
    return;
  }

  await prisma.homestayEmbedding.upsert({
    where: { homestayId },
    create: { homestayId, vector },
    update: { vector },
  });
  console.log(`[rag] Indexed homestay: ${homestay.name}`);
}


export async function searchHomestays(query, limit = 5) {
  const { vector: queryVector, provider } = await generateEmbedding(query, "search_query");

  if (provider !== "cohere") {
    console.warn("[rag] Gemini embedding used — skipping vector similarity search (dimension mismatch with Cohere index)");
    return [];
  }

  const results = await prisma.$queryRawUnsafe(
    `
    SELECT e.id, e.name, e.slug, e.village, e.region, e."pricePerNight", e."roomType", e.capacity, s.similarity
    FROM "homestays" e
    JOIN "homestay_embeddings" he ON e.id = he."homestayId"
    JOIN (
      SELECT "homestayId", SUM(a * b) AS similarity
      FROM "homestay_embeddings",
           UNNEST("vector") WITH ORDINALITY AS t1(a, i),
           UNNEST($1::double precision[]) WITH ORDINALITY AS t2(b, j)
      WHERE i = j
      GROUP BY "homestayId"
    ) s ON e.id = s."homestayId"
    ORDER BY s.similarity DESC
    LIMIT $2
    `,
    queryVector,
    limit,
  );

  return results;
}
