import prisma from "../config/database.js";
import { generateSlug } from "../utils/slug.js";
import { getPaginationParams, formatPaginationMeta } from "../utils/pagination.js";
import redisClient from "../config/redis.js";
import { indexHomestay } from "../rag/retriever.js";

const CACHE_TTL_SECONDS = 300; // 5 mins cache for public listings

export async function listHomestays(queryParams) {
  const { page, limit, skip } = getPaginationParams(queryParams);
  const { search, village, region, roomType, mealsIncluded, minPrice, maxPrice, guests, sortBy } = queryParams;

  // Build Prisma where filter
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { village: { contains: search, mode: "insensitive" } },
      { region: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (village) {
    where.village = { equals: village, mode: "insensitive" };
  }

  if (region) {
    where.region = { equals: region, mode: "insensitive" };
  }

  if (roomType) {
    where.roomType = roomType;
  }

  if (mealsIncluded) {
    where.mealsIncluded = mealsIncluded;
  }

  if (guests) {
    where.capacity = { gte: parseInt(guests, 10) };
  }

  if (minPrice || maxPrice) {
    where.pricePerNight = {};
    if (minPrice) where.pricePerNight.gte = parseInt(minPrice, 10);
    if (maxPrice) where.pricePerNight.lte = parseInt(maxPrice, 10);
  }

  // Sorting
  let orderBy = { createdAt: "desc" };
  if (sortBy === "price_asc") orderBy = { pricePerNight: "asc" };
  if (sortBy === "price_desc") orderBy = { pricePerNight: "desc" };
  if (sortBy === "capacity") orderBy = { capacity: "desc" };

  const [total, homestays] = await Promise.all([
    prisma.homestay.count({ where }),
    prisma.homestay.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    }),
  ]);

  // Compute average rating and review count per homestay
  const items = homestays.map((item) => {
    const reviewCount = item.reviews.length;
    const avgRating =
      reviewCount > 0
        ? parseFloat((item.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

    const { reviews, ...rest } = item;
    return {
      ...rest,
      reviewCount,
      avgRating,
    };
  });

  return {
    items,
    meta: formatPaginationMeta(total, page, limit),
  };
}

export async function getHomestayBySlugOrId(identifier) {
  const homestay = await prisma.homestay.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
    include: {
      reviews: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!homestay) {
    return null;
  }

  const reviewCount = homestay.reviews.length;
  const avgRating =
    reviewCount > 0
      ? parseFloat((homestay.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
      : 0;

  return {
    ...homestay,
    reviewCount,
    avgRating,
  };
}

export async function createHomestay(data) {
  let baseSlug = generateSlug(data.name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.homestay.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const newHomestay = await prisma.homestay.create({
    data: {
      ...data,
      slug,
    },
  });

  // Re-index embeddings so the chatbot can find this new homestay
  try {
    await indexHomestay(newHomestay.id);
  } catch (err) {
    console.warn(`[rag] Failed to index new homestay ${newHomestay.id}:`, err.message);
  }

  return newHomestay;
}

export async function updateHomestay(id, data) {
  const existing = await prisma.homestay.findUnique({ where: { id } });
  if (!existing) return null;

  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    let baseSlug = generateSlug(data.name);
    slug = baseSlug;
    let counter = 1;
    while (await prisma.homestay.findFirst({ where: { slug, NOT: { id } } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  const updated = await prisma.homestay.update({
    where: { id },
    data: {
      ...data,
      slug,
    },
  });

  // Re-index embeddings so the chatbot sees updated details
  try {
    await indexHomestay(updated.id);
  } catch (err) {
    console.warn(`[rag] Failed to re-index homestay ${updated.id}:`, err.message);
  }

  return updated;
}

export async function deleteHomestay(id) {
  const deleted = await prisma.homestay.delete({
    where: { id },
  });
  return deleted;
}
