import { prisma } from "@unisalon/db";
import { supabaseAdmin } from "../lib/supabase";
import type { SlotHoldEvent } from "@unisalon/types";

/**
 * Cleanup expired slot holds.
 * Runs every 30 seconds via Bun's native setInterval.
 * Marks ACTIVE holds past their expiresAt as EXPIRED,
 * then broadcasts SLOT_RELEASED events via Supabase Realtime.
 */
async function cleanupExpiredHolds() {
  const now = new Date();

  const expiredHolds = await prisma.slotHold.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    select: {
      id: true, shopId: true, staffId: true,
      date: true, startTime: true, endTime: true,
    },
  });

  if (expiredHolds.length === 0) return;

  // Batch update status
  await prisma.slotHold.updateMany({
    where: { id: { in: expiredHolds.map((h) => h.id) }, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });

  // Broadcast SLOT_RELEASED per shop (deduplicate by shopId+date+startTime)
  const seen = new Set<string>();
  for (const hold of expiredHolds) {
    const key = `${hold.shopId}:${hold.date}:${hold.startTime}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const payload: SlotHoldEvent = {
      type: "SLOT_RELEASED",
      shopId: hold.shopId,
      staffId: hold.staffId ?? undefined,
      date: hold.date,
      startTime: hold.startTime,
      endTime: hold.endTime,
    };

    await supabaseAdmin
      .channel(`shop:${hold.shopId}:slots`)
      .send({ type: "broadcast", event: "SLOT_RELEASED", payload });
  }

  console.log(`[HoldCleanup] Expired ${expiredHolds.length} holds, broadcasted releases`);
}

export function startHoldCleanupCron() {
  console.log("[HoldCleanup] Starting cron — runs every 30s");
  setInterval(cleanupExpiredHolds, 30_000);
  // Also run immediately on startup to catch any holds that expired during downtime
  cleanupExpiredHolds().catch(console.error);
}
