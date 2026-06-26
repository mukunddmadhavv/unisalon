import { Elysia, t } from "elysia";
import { prisma, type ServiceCategory } from "@unisalon/db";
import { requireOwner } from "../middleware/auth";
import { authPlugin } from "../middleware/auth";
import { supabaseAdmin } from "../lib/supabase";
import slugify from "slugify";

const auth = requireOwner();
// A lighter guard that just needs a valid Supabase token (any role)
const anyAuth = authPlugin("CUSTOMER", "OWNER", "ADMIN");

export const ownerRoutes = new Elysia({ prefix: "/api/owner" })

  // ─── Register: create ShopOwner row after Supabase signup ─────────
  .use(anyAuth)
  .post(
    "/register",
    async ({ body, auth: user }) => {
      const existing = await prisma.shopOwner.findUnique({
        where: { supabaseId: user.supabaseId },
      });
      if (existing) return { success: true, data: existing };

      const owner = await prisma.shopOwner.create({
        data: {
          supabaseId: user.supabaseId,
          email: user.email,
          name: body.name,
          phone: body.phone,
        },
      });
      return { success: true, data: owner };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        phone: t.String({ minLength: 10 }),
      }),
    }
  )

  // ─── Upload: server-side image upload (bypasses storage RLS) ──────
  .post(
    "/upload",
    async ({ body }) => {
      const { file, bucket, path } = body as {
        file: File;
        bucket: string;
        path: string;
      };

      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      const { error, data } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, uint8, {
          contentType: file.type || "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw new Error(`Storage upload failed: ${error.message}`);

      const { data: urlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { success: true, data: { url: urlData.publicUrl } };
    },
    {
      // multipart/form-data
      type: "formdata",
      body: t.Object({
        file: t.File({ maxSize: "10m" }),
        bucket: t.String(),
        path: t.String(),
      }),
    }
  )

  .use(auth)
  // ─── Shop CRUD ─────────────────────────────────────────────────────
  .get(
    "/shop",
    async ({ auth }) => {
      const shop = await prisma.shop.findFirst({
        where: { owner: { supabaseId: auth.supabaseId } },
      });
      return { success: true, data: shop };
    }
  )

  .post(
    "/shops",
    async ({ body, auth }) => {
      const owner = await prisma.shopOwner.findUnique({
        where: { supabaseId: auth.supabaseId },
        select: { id: true },
      });
      if (!owner) throw new Error("Owner account not found");

      const baseSlug = slugify(body.name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.shop.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter++}`;
      }

      const shop = await prisma.shop.create({
        data: { ...body, ownerId: owner.id, slug, status: "PENDING" },
      });

      return { success: true, data: shop };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        category: t.Union([t.Literal("MALE"), t.Literal("FEMALE"), t.Literal("UNISEX")]),
        address: t.String(),
        city: t.String(),
        district: t.String(),
        state: t.String(),
        pincode: t.String(),
        latitude: t.Optional(t.Number()),
        longitude: t.Optional(t.Number()),
        openTime: t.String(),
        closeTime: t.String(),
        workingDays: t.Array(t.String()),
      }),
    }
  )

  .put(
    "/shops/:id",
    async ({ params, body, auth, set }) => {
      const shop = await prisma.shop.findFirst({
        where: { id: params.id, owner: { supabaseId: auth.supabaseId } },
      });
      if (!shop) { set.status = 404; return { success: false, error: "Shop not found" }; }

      const updated = await prisma.shop.update({
        where: { id: params.id },
        data: body,
      });
      return { success: true, data: updated };
    },
    {
      body: t.Partial(t.Object({
        name: t.String(), description: t.String(),
        openTime: t.String(), closeTime: t.String(),
        workingDays: t.Array(t.String()),
      })),
    }
  )

  // ─── Staff CRUD ────────────────────────────────────────────────────
  .get(
    "/staff",
    async ({ auth }) => {
      const shop = await prisma.shop.findFirst({
        where: { owner: { supabaseId: auth.supabaseId } },
        select: { id: true },
      });
      if (!shop) return { success: true, data: [] };

      const staff = await prisma.staffMember.findMany({
        where: { shopId: shop.id },
        orderBy: { displayOrder: "asc" },
      });
      return { success: true, data: staff };
    }
  )

  .post(
    "/staff",
    async ({ body, auth, set }) => {
      const { shopId, ...staffData } = body;
      const shop = await prisma.shop.findFirst({
        where: { id: shopId, owner: { supabaseId: auth.supabaseId } },
        select: { id: true },
      });
      if (!shop) { set.status = 403; return { success: false, error: "Unauthorized" }; }

      const staff = await prisma.staffMember.create({
        data: { shopId, ...staffData },
      });
      return { success: true, data: staff };
    },
    {
      body: t.Object({
        shopId: t.String(),
        name: t.String(),
        specialization: t.Optional(t.String()),
        experience: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        displayOrder: t.Optional(t.Number()),
      }),
    }
  )

  .put(
    "/staff/:id",
    async ({ params, body, auth, set }) => {
      const staff = await prisma.staffMember.findFirst({
        where: { id: params.id, shop: { owner: { supabaseId: auth.supabaseId } } },
      });
      if (!staff) { set.status = 404; return { success: false, error: "Staff not found" }; }

      const updated = await prisma.staffMember.update({
        where: { id: params.id },
        data: body,
      });
      return { success: true, data: updated };
    },
    {
      body: t.Partial(t.Object({
        name: t.String(), specialization: t.String(),
        experience: t.String(), bio: t.String(),
        isActive: t.Boolean(), displayOrder: t.Number(),
      })),
    }
  )

  .delete("/staff/:id", async ({ params, auth, set }) => {
    const staff = await prisma.staffMember.findFirst({
      where: { id: params.id, shop: { owner: { supabaseId: auth.supabaseId } } },
    });
    if (!staff) { set.status = 404; return { success: false, error: "Staff not found" }; }

    await prisma.staffMember.delete({ where: { id: params.id } });
    return { success: true, data: { deleted: true } };
  })

  // ─── Service CRUD ──────────────────────────────────────────────────
  .get(
    "/services",
    async ({ auth }) => {
      const shop = await prisma.shop.findFirst({
        where: { owner: { supabaseId: auth.supabaseId } },
        select: { id: true },
      });
      if (!shop) return { success: true, data: [] };

      const services = await prisma.service.findMany({
        where: { shopId: shop.id },
        orderBy: { displayOrder: "asc" },
      });
      return { success: true, data: services };
    }
  )

  .post(
    "/services",
    async ({ body, auth, set }) => {
      const { shopId, ...serviceData } = body;
      const shop = await prisma.shop.findFirst({
        where: { id: shopId, owner: { supabaseId: auth.supabaseId } },
        select: { id: true },
      });
      if (!shop) { set.status = 403; return { success: false, error: "Unauthorized" }; }

      const service = await prisma.service.create({
        data: {
          shopId,
          ...serviceData,
          category: serviceData.category as ServiceCategory,
        },
      });
      return { success: true, data: service };
    },
    {
      body: t.Object({
        shopId: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        category: t.String(),
        price: t.Number(),
        durationMins: t.Number(),
        imageUrl: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )

  .put(
    "/services/:id",
    async ({ params, body, auth, set }) => {
      const svc = await prisma.service.findFirst({
        where: { id: params.id, shop: { owner: { supabaseId: auth.supabaseId } } },
      });
      if (!svc) { set.status = 404; return { success: false, error: "Service not found" }; }

      const updated = await prisma.service.update({
        where: { id: params.id },
        data: {
          ...body,
          category: body.category ? body.category as ServiceCategory : undefined,
        },
      });
      return { success: true, data: updated };
    },
    {
      body: t.Partial(t.Object({
        name: t.String(),
        price: t.Number(),
        durationMins: t.Number(),
        isActive: t.Boolean(),
        description: t.String(),
        category: t.String(),
        imageUrl: t.String(),
      })),
    }
  )

  .delete("/services/:id", async ({ params, auth, set }) => {
    const svc = await prisma.service.findFirst({
      where: { id: params.id, shop: { owner: { supabaseId: auth.supabaseId } } },
    });
    if (!svc) { set.status = 404; return { success: false, error: "Service not found" }; }

    await prisma.service.update({ where: { id: params.id }, data: { isActive: false } });
    return { success: true, data: { deleted: true } };
  })

  // ─── Bookings ──────────────────────────────────────────────────────
  .get(
    "/bookings",
    async ({ auth, query }) => {
      const shop = await prisma.shop.findFirst({
        where: { owner: { supabaseId: auth.supabaseId } },
        select: { id: true },
      });
      if (!shop) return { success: true, data: [] };

      const bookings = await prisma.booking.findMany({
        where: {
          shopId: shop.id,
          ...(query.date && { date: query.date }),
          ...(query.status && { status: query.status as never }),
        },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          staff: { select: { name: true } },
          services: true,
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      });
      return { success: true, data: bookings };
    },
    { query: t.Object({ date: t.Optional(t.String()), status: t.Optional(t.String()) }) }
  )

  .put(
    "/bookings/:id/status",
    async ({ params, body, auth, set }) => {
      const booking = await prisma.booking.findFirst({
        where: { id: params.id, shop: { owner: { supabaseId: auth.supabaseId } } },
      });
      if (!booking) { set.status = 404; return { success: false, error: "Booking not found" }; }

      const updated = await prisma.booking.update({
        where: { id: params.id },
        data: { status: body.status as never },
      });
      return { success: true, data: updated };
    },
    { body: t.Object({ status: t.String() }) }
  )

  // ─── Notifications ─────────────────────────────────────────────────
  .get("/notifications", async ({ auth }) => {
    const shop = await prisma.shop.findFirst({
      where: { owner: { supabaseId: auth.supabaseId } },
      select: { id: true },
    });
    if (!shop) return { success: true, data: [] };

    const notifications = await prisma.shopNotification.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { success: true, data: notifications };
  })

  .put("/notifications/read", async ({ auth }) => {
    const shop = await prisma.shop.findFirst({
      where: { owner: { supabaseId: auth.supabaseId } },
      select: { id: true },
    });
    if (!shop) return { success: true, data: {} };

    await prisma.shopNotification.updateMany({
      where: { shopId: shop.id, isRead: false },
      data: { isRead: true },
    });
    return { success: true, data: { marked: true } };
  });
