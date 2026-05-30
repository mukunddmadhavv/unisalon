import { Elysia, t } from "elysia";
import { requireCustomer } from "../middleware/auth";
import { createSlotHold, releaseSlotHold } from "../lib/holdService";
import { timeToMinutes, minutesToTime } from "../lib/slotEngine";
import { prisma } from "@unisalon/db";

const auth = requireCustomer();

export const slotHoldRoutes = new Elysia({ prefix: "/api/slots" })
  .use(auth)
  // ── Create a 90s slot hold ─────────────────────────────────────────
  .post(
    "/hold",
    async ({ body, auth, set }) => {
      const { shopId, staffId, date, startTime, serviceIds } = body;

      // Compute endTime from service durations
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds }, shopId, isActive: true },
        select: { durationMins: true },
      });

      if (services.length !== serviceIds.length) {
        set.status = 400;
        return { success: false, error: "One or more services not found" };
      }

      const totalMins = services.reduce((sum, s) => sum + s.durationMins, 0);
      const endTime = minutesToTime(timeToMinutes(startTime) + totalMins);

      try {
        const result = await createSlotHold({
          shopId,
          staffId: staffId ?? undefined,
          date,
          startTime,
          endTime,
          serviceIds,
          userId: auth.supabaseId,
        });
        return { success: true, data: result };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "SLOT_TAKEN") {
          set.status = 409;
          return { success: false, error: "This slot was just taken. Please choose another.", code: "SLOT_TAKEN" };
        }
        throw err;
      }
    },
    {
      body: t.Object({
        shopId: t.String(),
        staffId: t.Optional(t.String()),
        date: t.String(),
        startTime: t.String(),
        serviceIds: t.Array(t.String()),
      }),
    }
  )

  // ── Check hold status + remaining seconds ──────────────────────────
  .get("/hold/:holdId", async ({ params, auth, set }) => {
    const hold = await prisma.slotHold.findUnique({ where: { id: params.holdId } });
    if (!hold || hold.userId !== auth.supabaseId) {
      set.status = 404;
      return { success: false, error: "Hold not found" };
    }

    const remainingSecs = Math.max(
      0,
      Math.floor((hold.expiresAt.getTime() - Date.now()) / 1000)
    );
    const isExpired = remainingSecs === 0 || hold.status !== "ACTIVE";

    return {
      success: true,
      data: {
        holdId: hold.id,
        status: hold.status,
        remainingSecs,
        isExpired,
        date: hold.date,
        startTime: hold.startTime,
        endTime: hold.endTime,
      },
    };
  })

  // ── Release hold early ────────────────────────────────────────────
  .delete("/hold/:holdId", async ({ params, auth }) => {
    await releaseSlotHold(params.holdId, auth.supabaseId);
    return { success: true, data: { released: true } };
  });
