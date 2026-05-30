import { Elysia, t } from "elysia";
import { prisma } from "@unisalon/db";
import { requireCustomer } from "../middleware/auth";
import { convertHoldToBooking } from "../lib/holdService";
import { sendBookingConfirmationEmail } from "../lib/email";

const auth = requireCustomer();

export const customerRoutes = new Elysia({ prefix: "/api" })
  .use(auth)
  // ── Create booking (convert active hold) ──────────────────────────
  .post(
    "/bookings",
    async ({ body, auth, set }) => {
      try {
        const booking = await convertHoldToBooking({
          holdId: body.holdId,
          userId: auth.supabaseId,
          notes: body.notes,
        });

        // Send confirmation email (non-blocking)
        sendBookingConfirmationEmail(booking).catch(console.error);

        return { success: true, data: booking };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "HOLD_EXPIRED") {
          set.status = 410;
          return { success: false, error: "Your booking window expired. Please select a new slot.", code: "HOLD_EXPIRED" };
        }
        if (msg === "SLOT_TAKEN") {
          set.status = 409;
          return { success: false, error: "This slot was just booked by someone else.", code: "SLOT_TAKEN" };
        }
        throw err;
      }
    },
    {
      body: t.Object({
        holdId: t.String(),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // ── My bookings ────────────────────────────────────────────────────
  .get("/bookings/me", async ({ auth }) => {
    const user = await prisma.user.findUnique({
      where: { supabaseId: auth.supabaseId },
      select: { id: true },
    });
    if (!user) return { success: true, data: [] };

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        shop: { select: { name: true, slug: true, coverImage: true, address: true, city: true } },
        staff: { select: { name: true, photoUrl: true } },
        services: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return { success: true, data: bookings };
  })

  // ── Cancel booking ─────────────────────────────────────────────────
  .put("/bookings/:id/cancel", async ({ params, auth, set }) => {
    const user = await prisma.user.findUnique({
      where: { supabaseId: auth.supabaseId },
      select: { id: true },
    });
    if (!user) { set.status = 404; return { success: false, error: "User not found" }; }

    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking || booking.userId !== user.id) {
      set.status = 404;
      return { success: false, error: "Booking not found" };
    }
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      set.status = 400;
      return { success: false, error: "Booking cannot be cancelled" };
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    // Notify shop owner
    await prisma.shopNotification.create({
      data: {
        shopId: booking.shopId,
        type: "BOOKING_CANCELLED",
        title: "Booking Cancelled",
        body: `Booking for ${booking.date} at ${booking.startTime} was cancelled.`,
        metadata: { bookingId: booking.id },
      },
    });

    return { success: true, data: updated };
  })

  // ── Post review ────────────────────────────────────────────────────
  .post(
    "/reviews",
    async ({ body, auth, set }) => {
      const user = await prisma.user.findUnique({
        where: { supabaseId: auth.supabaseId },
        select: { id: true },
      });
      if (!user) { set.status = 404; return { success: false, error: "User not found" }; }

      const review = await prisma.review.upsert({
        where: { userId_shopId: { userId: user.id, shopId: body.shopId } },
        create: { userId: user.id, shopId: body.shopId, rating: body.rating, comment: body.comment },
        update: { rating: body.rating, comment: body.comment },
      });

      // Recalculate shop rating
      const agg = await prisma.review.aggregate({
        where: { shopId: body.shopId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.shop.update({
        where: { id: body.shopId },
        data: { rating: agg._avg.rating ?? 0, totalReviews: agg._count.rating },
      });

      return { success: true, data: review };
    },
    {
      body: t.Object({
        shopId: t.String(),
        rating: t.Number({ minimum: 1, maximum: 5 }),
        comment: t.Optional(t.String()),
      }),
    }
  );
