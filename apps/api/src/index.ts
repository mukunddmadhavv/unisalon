import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { bearer } from "@elysiajs/bearer";
import { swagger } from "@elysiajs/swagger";

import { publicRoutes } from "./routes/public";
import { slotHoldRoutes } from "./routes/slots";
import { customerRoutes } from "./routes/customer";
import { ownerRoutes } from "./routes/owner";
import { adminRoutes } from "./routes/admin";
import { startHoldCleanupCron } from "./cron/holdCleanup";

const PORT = Number(process.env.PORT) || 3001;

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    })
  )
  .use(bearer())
  .use(
    swagger({
      documentation: {
        info: {
          title: "UniSalon API",
          version: "1.0.0",
          description: "REST API for UniSalon — India's salon booking platform",
        },
      },
      path: "/docs",
    })
  )
  // Health check
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }))
  // Routes
  .use(publicRoutes)
  .use(slotHoldRoutes)
  .use(customerRoutes)
  .use(ownerRoutes)
  .use(adminRoutes)
  .onError(({ error, code }) => {
    console.error(`[${code}]`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      code,
    };
  });

// Start expired hold cleanup cron (runs every 30s)
startHoldCleanupCron();

app.listen({ port: PORT, hostname: "0.0.0.0" }, () => {
  console.log(`🚀 UniSalon API running on http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/docs`);
});

export type App = typeof app;
