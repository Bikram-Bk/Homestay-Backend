import prisma from "../config/database.js";

export async function listVillages() {
  const homestayStats = await prisma.homestay.groupBy({
    by: ["village", "region"],
    _count: { id: true },
    _min: { pricePerNight: true },
  });

  const guides = await prisma.villageGuide.findMany();
  const guideMap = new Map(guides.map((g) => [g.village.toLowerCase(), g]));

  const villages = homestayStats.map((item) => {
    const guide = guideMap.get(item.village.toLowerCase());
    return {
      village: item.village,
      region: item.region,
      homestayCount: item._count.id,
      startingPrice: item._min.pricePerNight,
      tags: guide?.tags || [],
      snippet: guide?.content ? guide.content.slice(0, 180) + "..." : null,
    };
  });

  return villages;
}

export async function getVillageGuide(villageName) {
  return prisma.villageGuide.findFirst({
    where: {
      village: { equals: villageName, mode: "insensitive" },
    },
  });
}

export async function listVillageGuides() {
  return prisma.villageGuide.findMany({
    orderBy: { village: "asc" },
  });
}

export async function createVillageGuide(data) {
  return prisma.villageGuide.create({ data });
}

export async function updateVillageGuide(id, data) {
  return prisma.villageGuide.update({
    where: { id },
    data,
  });
}

export async function deleteVillageGuide(id) {
  return prisma.villageGuide.delete({
    where: { id },
  });
}
