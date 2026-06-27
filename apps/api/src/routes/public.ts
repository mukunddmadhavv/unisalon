import { Elysia, t } from "elysia";
import { prisma } from "@unisalon/db";
import { computeAvailableSlots } from "../lib/slotEngine";

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const publicRoutes = new Elysia({ prefix: "/api" })
  // ── Districts list (for geolocation fallback) ──────────────────────
  .get("/districts", async () => {
    const districts = await prisma.shop.findMany({
      where: { status: "APPROVED" },
      select: { district: true, state: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    });
    return { success: true, data: districts.map(d => d.district) };
  })

  // ── Service categories ─────────────────────────────────────────────
  .get("/services/categories", () => ({
    success: true,
    data: [
      "HAIRCUT", "BEARD", "FACIAL", "MASSAGE",
      "HAIR_COLOR", "HAIR_SPA", "WAXING", "KERATIN", "STRAIGHTENING", "OTHER",
    ],
  }))

  // ── Shops list with search + geolocation ──────────────────────────
  .get(
    "/shops",
    async ({ query }) => {
      const {
        district, lat, lng, radius,
        category, search, page = "1", limit = "12", sortBy,
      } = query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: Record<string, any> = {
        status: "APPROVED",
        ...(district && { district: { contains: district, mode: "insensitive" } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            {
              services: {
                some: { name: { contains: search, mode: "insensitive" }, isActive: true },
              },
            },
          ],
        }),
      };

      if (category) {
        if (["MALE", "FEMALE", "UNISEX"].includes(category)) {
          where.category = category;
        } else {
          where.services = {
            some: {
              category: category,
              isActive: true,
            },
          };
        }
      }

      // Fetch all matching approved shops
      const allShops = await prisma.shop.findMany({
        where,
        select: {
          id: true, slug: true, name: true, category: true,
          coverImage: true, rating: true, totalReviews: true,
          city: true, district: true, address: true,
          openTime: true, closeTime: true, workingDays: true,
          isVerified: true, latitude: true, longitude: true,
          services: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, durationMins: true, category: true },
            take: 5,
          },
        },
      });

      // Calculate distance for each shop
      const userLat = lat ? Number(lat) : null;
      const userLng = lng ? Number(lng) : null;

      let shopsWithDistance = allShops.map((shop) => {
        let distanceKm: number | null = null;
        if (
          userLat !== null && !isNaN(userLat) &&
          userLng !== null && !isNaN(userLng) &&
          shop.latitude !== null &&
          shop.longitude !== null
        ) {
          distanceKm = getDistanceKm(userLat, userLng, Number(shop.latitude), Number(shop.longitude));
        }
        return { ...shop, distanceKm };
      });

      // Filter by radius if provided
      const searchRadius = radius ? Number(radius) : null;
      if (searchRadius !== null && !isNaN(searchRadius) && userLat !== null && userLng !== null) {
        shopsWithDistance = shopsWithDistance.filter(
          (shop) => shop.distanceKm !== null && shop.distanceKm <= searchRadius
        );
      }

      // Sort matching shops
      if (sortBy === "distance" && userLat !== null && userLng !== null) {
        shopsWithDistance.sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      } else if (sortBy === "rating") {
        shopsWithDistance.sort((a, b) => b.rating - a.rating);
      } else {
        // Default sorting: distance if coordinates are present, else rating (descending)
        if (userLat !== null && userLng !== null) {
          shopsWithDistance.sort((a, b) => {
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
          });
        } else {
          shopsWithDistance.sort((a, b) => b.rating - a.rating);
        }
      }

      const total = shopsWithDistance.length;
      const paginatedShops = shopsWithDistance.slice(skip, skip + Number(limit));

      return {
        success: true,
        data: {
          shops: paginatedShops,
          pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
        },
      };
    },
    {
      query: t.Object({
        district: t.Optional(t.String()),
        lat: t.Optional(t.String()),
        lng: t.Optional(t.String()),
        radius: t.Optional(t.String()),
        category: t.Optional(t.String()),
        search: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sortBy: t.Optional(t.String()),
      }),
    }
  )

  // ── Shop detail by slug ────────────────────────────────────────────
  .get("/shops/:slug", async ({ params, set }) => {
    const shop = await prisma.shop.findUnique({
      where: { slug: params.slug, status: "APPROVED" },
      include: {
        services: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
        staff: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
        reviews: {
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!shop) {
      set.status = 404;
      return { success: false, error: "Shop not found" };
    }

    return { success: true, data: shop };
  })

  // ── Slot availability (computed, service-duration-aware) ───────────
  .get(
    "/shops/:slug/slots",
    async ({ params, query, set }) => {
      const { date, serviceIds } = query;
      if (!date || !serviceIds) {
        set.status = 400;
        return { success: false, error: "date and serviceIds are required" };
      }

      const ids = serviceIds.split(",").filter(Boolean);
      if (ids.length === 0) {
        set.status = 400;
        return { success: false, error: "At least one serviceId is required" };
      }

      const availability = await computeAvailableSlots(params.slug, date, ids);
      return { success: true, data: availability };
    },
    {
      query: t.Object({
        date: t.Optional(t.String()),
        serviceIds: t.Optional(t.String()),
      }),
    }
  );
