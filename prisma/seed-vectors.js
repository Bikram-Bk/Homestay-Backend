import prisma from "../config/database.js";
import { indexHomestay } from "../rag/retriever.js";

async function main() {
  const homestays = await prisma.homestay.findMany({ select: { id: true, name: true } });
  console.log(`Indexing ${homestays.length} homestays...`);
  for (const h of homestays) {
    try {
      await indexHomestay(h.id);
    } catch (err) {
      console.warn(`Failed to index ${h.name}:`, err.message);
    }
  }
  console.log("Done.");
  process.exit(0);
}

main();
