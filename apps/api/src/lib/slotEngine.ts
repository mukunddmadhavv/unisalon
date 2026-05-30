import { prisma } from "@unisalon/db";
import type { ShopAvailabilityResponse, StaffAvailability, TimeSlot } from "@unisalon/types";

// ─────────────────────────────────────────────
// Time utilities
// ─────────────────────────────────────────────

/** Convert "HH:MM" to minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight to "HH:MM" */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Get day-of-week abbreviation from a date string "YYYY-MM-DD" */
export function getDayAbbrev(dateStr: string): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[new Date(dateStr).getDay()];
}

// ─────────────────────────────────────────────
// Overlap check
// ─────────────────────────────────────────────

function overlaps(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

// ─────────────────────────────────────────────
// Core: Compute available slots for a shop
// ─────────────────────────────────────────────

export async function computeAvailableSlots(
  shopId: string,
  date: string,
  serviceIds: string[],
  requestingUserId?: string
): Promise<ShopAvailabilityResponse> {
  // 1. Fetch shop + services
  const [shop, services] = await Promise.all([
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        openTime: true, closeTime: true, workingDays: true,
        staff: { where: { isActive: true }, select: { id: true, name: true, photoUrl: true } },
      },
    }),
    prisma.service.findMany({
      where: { id: { in: serviceIds }, shopId, isActive: true },
      select: { id: true, durationMins: true },
    }),
  ]);

  if (!shop) throw new Error("Shop not found");

  // 2. Check if shop is open on this day
  const dayAbbrev = getDayAbbrev(date);
  if (!shop.workingDays.includes(dayAbbrev)) {
    return {
      date, totalDurationMins: 0, byStaff: [], anyAvailable: [],
    };
  }

  // 3. Compute total booking duration
  const totalDurationMins = services.reduce((sum, s) => sum + s.durationMins, 0);
  const shopOpen = timeToMinutes(shop.openTime);
  const shopClose = timeToMinutes(shop.closeTime);

  // 4. Fetch existing confirmed bookings and active holds for this date
  const [existingBookings, activeHolds] = await Promise.all([
    prisma.booking.findMany({
      where: {
        shopId, date,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { staffId: true, startTime: true, endTime: true },
    }),
    prisma.slotHold.findMany({
      where: {
        shopId, date,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      select: { staffId: true, startTime: true, endTime: true, userId: true },
    }),
  ]);

  // 5. Generate slots per staff member
  const STEP_MINS = 15; // 15-min increments

  const computeSlotsForStaff = (staffId: string | null): TimeSlot[] => {
    const busyBlocks = [
      ...existingBookings
        .filter((b) => staffId === null || b.staffId === staffId || b.staffId === null)
        .map((b) => ({
          start: timeToMinutes(b.startTime),
          end: timeToMinutes(b.endTime),
          heldByMe: false,
        })),
      ...activeHolds
        .filter((h) => staffId === null || h.staffId === staffId || h.staffId === null)
        .map((h) => ({
          start: timeToMinutes(h.startTime),
          end: timeToMinutes(h.endTime),
          heldByMe: h.userId === requestingUserId,
        })),
    ];

    const slots: TimeSlot[] = [];
    let cursor = shopOpen;

    while (cursor + totalDurationMins <= shopClose) {
      const slotEnd = cursor + totalDurationMins;
      const startTime = minutesToTime(cursor);
      const endTime = minutesToTime(slotEnd);

      const conflictingHold = busyBlocks.find(
        (b) => !b.heldByMe && overlaps(cursor, slotEnd, b.start, b.end)
      );
      const heldByMe = busyBlocks.find(
        (b) => b.heldByMe && overlaps(cursor, slotEnd, b.start, b.end)
      );

      slots.push({
        startTime,
        endTime,
        available: !conflictingHold,
        heldByMe: !!heldByMe,
      });

      cursor += STEP_MINS;
    }

    return slots;
  };

  // 6. Compute per staff
  const byStaff: StaffAvailability[] = shop.staff.map((s) => ({
    staffId: s.id,
    staffName: s.name,
    photoUrl: s.photoUrl,
    slots: computeSlotsForStaff(s.id),
  }));

  // 7. "Any Available" — a slot is available if at least one staff is free
  const anyAvailable: TimeSlot[] = (() => {
    if (shop.staff.length === 0) {
      // Shop with no staff: treat as single "pool"
      return computeSlotsForStaff(null);
    }

    const allTimes = new Set<string>();
    byStaff.forEach((s) => s.slots.forEach((sl) => allTimes.add(sl.startTime)));

    return Array.from(allTimes)
      .sort()
      .map((startTime) => {
        const anyFree = byStaff.some((s) => {
          const slot = s.slots.find((sl) => sl.startTime === startTime);
          return slot?.available || slot?.heldByMe;
        });
        const heldByMe = byStaff.some((s) => {
          const slot = s.slots.find((sl) => sl.startTime === startTime);
          return slot?.heldByMe;
        });
        const refSlot = byStaff[0].slots.find((sl) => sl.startTime === startTime)!;
        return { startTime, endTime: refSlot.endTime, available: anyFree, heldByMe };
      });
  })();

  return { date, totalDurationMins, byStaff, anyAvailable };
}
