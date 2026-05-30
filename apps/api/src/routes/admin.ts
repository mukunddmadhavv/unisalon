import { Elysia, t } from "elysia";
import { prisma } from "@unisalon/db";
import { requireAdmin } from "../middleware/auth";
import { sendShopStatusEmail } from "../lib/email";

const auth = requireAdmin();

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(auth)
  // ── Dashboard KPIs ─────────────────────────────────────────────────
  .get("/stats", async () => {
    const today = new Date().toISOString().split("T")[0];
    const [
      pendingShops, totalShops, totalUsers, totalBookings,
      todayBookings, totalOwners,
    ] = await Promise.all([
      prisma.shop.count({ where: { status: "PENDING" } }),
      prisma.shop.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { date: today } }),
      prisma.shopOwner.count(),
    ]);

    return {
      success: true,
      data: { pendingShops, totalShops, totalUsers, totalBookings, todayBookings, totalOwners },
    };
  })

  // ── All shops ──────────────────────────────────────────────────────
  .get(
    "/shops",
    async ({ query }) => {
      const { status, city, district, category, search, page = "1" } = query;
      const skip = (Number(page) - 1) * 20;

      const where: Record<string, unknown> = {
        ...(status && { status }),
        ...(city && { city: { contains: city, mode: "insensitive" } }),
        ...(district && { district: { contains: district, mode: "insensitive" } }),
        ...(category && { category }),
        ...(search && { name: { contains: search, mode: "insensitive" } }),
      };

      const [shops, total] = await Promise.all([
        prisma.shop.findMany({
          where,
          skip,
          take: 20,
          include: {
            owner: { select: { name: true, email: true, phone: true } },
            _count: { select: { services: true, staff: true, bookings: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.shop.count({ where }),
      ]);

      return { success: true, data: { shops, total, page: Number(page) } };
    },
    {
      query: t.Object({
        status: t.Optional(t.String()), city: t.Optional(t.String()),
        district: t.Optional(t.String()), category: t.Optional(t.String()),
        search: t.Optional(t.String()), page: t.Optional(t.String()),
      }),
    }
  )

  // ── Approve shop ───────────────────────────────────────────────────
  .put("/shops/:id/approve", async ({ params, auth }) => {
    const shop = await prisma.shop.update({
      where: { id: params.id },
      data: { status: "APPROVED", isVerified: true },
      include: { owner: { select: { email: true, name: true } } },
    });

    await Promise.all([
      prisma.adminLog.create({
        data: {
          adminId: auth.supabaseId,
          action: "APPROVE_SHOP",
          targetType: "SHOP",
          targetId: params.id,
          shopId: params.id,
        },
      }),
      prisma.shopNotification.create({
        data: {
          shopId: shop.id,
          type: "SHOP_APPROVED",
          title: "🎉 Your shop is approved!",
          body: "Your shop is now live on UniSalon. Customers can start booking.",
          metadata: { shopId: shop.id },
        },
      }),
      sendShopStatusEmail(shop.owner.email, shop.owner.name, shop.name, "APPROVED"),
    ]);

    return { success: true, data: shop };
  })

  // ── Reject shop ────────────────────────────────────────────────────
  .put(
    "/shops/:id/reject",
    async ({ params, body, auth }) => {
      const shop = await prisma.shop.update({
        where: { id: params.id },
        data: { status: "REJECTED" },
        include: { owner: { select: { email: true, name: true } } },
      });

      await Promise.all([
        prisma.adminLog.create({
          data: {
            adminId: auth.supabaseId,
            action: "REJECT_SHOP",
            targetType: "SHOP",
            targetId: params.id,
            shopId: params.id,
            metadata: { reason: body.reason },
          },
        }),
        prisma.shopNotification.create({
          data: {
            shopId: shop.id,
            type: "SHOP_REJECTED",
            title: "Shop Application Update",
            body: `Your shop application was not approved. Reason: ${body.reason}`,
            metadata: { reason: body.reason },
          },
        }),
        sendShopStatusEmail(shop.owner.email, shop.owner.name, shop.name, "REJECTED", body.reason),
      ]);

      return { success: true, data: shop };
    },
    { body: t.Object({ reason: t.String() }) }
  )

  // ── All users ──────────────────────────────────────────────────────
  .get(
    "/users",
    async ({ query }) => {
      const { search, page = "1" } = query;
      const skip = (Number(page) - 1) * 25;
      const users = await prisma.user.findMany({
        where: search
          ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
          : {},
        skip,
        take: 25,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { bookings: true, reviews: true } } },
      });
      return { success: true, data: users };
    },
    { query: t.Object({ search: t.Optional(t.String()), page: t.Optional(t.String()) }) }
  )

  // ── Admin logs ─────────────────────────────────────────────────────
  .get(
    "/logs",
    async ({ query }) => {
      const { page = "1", action } = query;
      const skip = (Number(page) - 1) * 30;
      const logs = await prisma.adminLog.findMany({
        where: action ? { action } : {},
        skip,
        take: 30,
        orderBy: { createdAt: "desc" },
        include: { shop: { select: { name: true } } },
      });
      return { success: true, data: logs };
    },
    { query: t.Object({ page: t.Optional(t.String()), action: t.Optional(t.String()) }) }
  );
