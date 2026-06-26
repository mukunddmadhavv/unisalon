import { prisma } from "@unisalon/db";
import { supabaseAdmin } from "./supabase";
import type { SlotHoldEvent } from "@unisalon/types";

const HOLD_EXPIRY_SECONDS = Number(process.env.HOLD_EXPIRY_SECONDS ?? 90);
const REALTIME_CHANNEL = (shopId: string) => `shop:${shopId}:slots`;

/**
 * Broadcast a slot event to all connected clients via Supabase Realtime
 */
async function broadcastSlotEvent(shopId: string, event: SlotHoldEvent) {
  await supabaseAdmin
    .channel(REALTIME_CHANNEL(shopId))
    .send({
      type: "broadcast",
      event: event.type,
      payload: event,
    });
}

// ─────────────────────────────────────────────
// Create a 90s slot hold (BookMyShow style)
// ─────────────────────────────────────────────

export async function createSlotHold(params: {
  shopId: string;
  staffId?: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceIds: string[];
  userId: string;
}) {
  const { shopId, staffId, date, startTime, endTime, serviceIds, userId } = params;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: userId },
    select: { id: true },
  });
  if (!dbUser) throw new Error("User not found");

  // Check for conflicting ACTIVE holds or confirmed bookings
  const [conflictHold, conflictBooking] = await Promise.all([
    prisma.slotHold.findFirst({
      where: {
        shopId,
        date,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
        staffId: staffId ?? null,
        // Overlap check: existing.startTime < endTime AND existing.endTime > startTime
        // Prisma doesn't support interval math, so fetch candidates and filter
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    }),
    prisma.booking.findFirst({
      where: {
        shopId, date,
        staffId: staffId ?? null,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    }),
  ]);

  if (conflictHold || conflictBooking) {
    throw new Error("SLOT_TAKEN");
  }

  // Release any previous ACTIVE holds by this user for the same shop+date
  await prisma.slotHold.updateMany({
    where: { userId: dbUser.id, shopId, date, status: "ACTIVE" },
    data: { status: "RELEASED" },
  });

  const expiresAt = new Date(Date.now() + HOLD_EXPIRY_SECONDS * 1000);

  const hold = await prisma.slotHold.create({
    data: {
      shopId, staffId: staffId ?? null,
      date, startTime, endTime,
      serviceIds, userId: dbUser.id,
      status: "ACTIVE",
      expiresAt,
    },
  });

  // Broadcast to all viewers
  await broadcastSlotEvent(shopId, {
    type: "SLOT_HOLD",
    shopId, staffId,
    date, startTime, endTime,
  });

  return { hold, expiresAt, expirySeconds: HOLD_EXPIRY_SECONDS };
}

// ─────────────────────────────────────────────
// Release a hold early (user navigates away)
// ─────────────────────────────────────────────

export async function releaseSlotHold(holdId: string, userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: userId },
    select: { id: true },
  });
  if (!dbUser) throw new Error("User not found");

  const hold = await prisma.slotHold.findUnique({ where: { id: holdId } });
  if (!hold || hold.userId !== dbUser.id || hold.status !== "ACTIVE") {
    throw new Error("Hold not found or already expired");
  }

  await prisma.slotHold.update({
    where: { id: holdId },
    data: { status: "RELEASED" },
  });

  await broadcastSlotEvent(hold.shopId, {
    type: "SLOT_RELEASED",
    shopId: hold.shopId,
    staffId: hold.staffId ?? undefined,
    date: hold.date,
    startTime: hold.startTime,
    endTime: hold.endTime,
  });
}

// ─────────────────────────────────────────────
// Convert active hold to confirmed booking (atomic)
// ─────────────────────────────────────────────

export async function convertHoldToBooking(params: {
  holdId: string;
  userId: string;
  notes?: string;
}) {
  const { holdId, userId, notes } = params;

  return prisma.$transaction(async (tx) => {
    // 1. Lock and verify hold
    const hold = await tx.slotHold.findUnique({ where: { id: holdId } });
    if (!hold) throw new Error("Hold not found");

    // Resolve user DB id
    const user = await tx.user.findUnique({
      where: { supabaseId: userId },
      select: { id: true },
    });
    if (!user) throw new Error("User not found");

    if (hold.userId !== user.id) throw new Error("Unauthorized");
    if (hold.status !== "ACTIVE") throw new Error("HOLD_EXPIRED");
    if (hold.expiresAt < new Date()) {
      await tx.slotHold.update({ where: { id: holdId }, data: { status: "EXPIRED" } });
      throw new Error("HOLD_EXPIRED");
    }

    // 2. Double-check for conflicts (race condition protection)
    const conflict = await tx.booking.findFirst({
      where: {
        shopId: hold.shopId, date: hold.date,
        staffId: hold.staffId ?? null,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: hold.endTime },
        endTime: { gt: hold.startTime },
      },
    });
    if (conflict) throw new Error("SLOT_TAKEN");

    // 3. Fetch service snapshots
    const services = await tx.service.findMany({
      where: { id: { in: hold.serviceIds } },
      select: { id: true, name: true, price: true, durationMins: true },
    });
    const totalAmount = services.reduce((sum, s) => sum + s.price, 0);

    // 5. Create booking
    const booking = await tx.booking.create({
      data: {
        userId: user.id,
        shopId: hold.shopId,
        staffId: hold.staffId ?? null,
        holdId: hold.id,
        date: hold.date,
        startTime: hold.startTime,
        endTime: hold.endTime,
        totalAmount,
        notes: notes ?? null,
        status: "PENDING",
        services: {
          create: services.map((s) => ({
            serviceId: s.id,
            pricePaise: s.price,
            durationMins: s.durationMins,
            serviceName: s.name,
          })),
        },
      },
      include: {
        services: true,
        shop: { select: { name: true, address: true, city: true } },
        user: { select: { name: true, email: true } },
      },
    });

    // 6. Mark hold as converted
    await tx.slotHold.update({
      where: { id: holdId },
      data: { status: "CONVERTED" },
    });

    // 7. Create in-app notification for shop owner
    await tx.shopNotification.create({
      data: {
        shopId: hold.shopId,
        type: "NEW_BOOKING",
        title: "New Booking!",
        body: `${booking.user.name} booked for ${hold.date} at ${hold.startTime}`,
        metadata: { bookingId: booking.id, userId: user.id },
      },
    });

    return booking;
  });
}
