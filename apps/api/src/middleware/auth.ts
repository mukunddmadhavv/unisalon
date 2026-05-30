import { Elysia } from "elysia";
import { verifyToken, type AuthUser } from "../lib/supabase";

/**
 * Auth guard plugin — adds `auth` to context for downstream handlers.
 * Usage: .use(authPlugin("CUSTOMER", "ADMIN"))
 */
export const authPlugin = (...roles: AuthUser["role"][]) =>
  new Elysia({ name: `auth-${roles.join("-")}` })
    .derive({ as: "scoped" }, async ({ headers, set }) => {
      const authorization = headers["authorization"];
      const token = authorization?.replace("Bearer ", "");

      if (!token) {
        set.status = 401;
        throw new Error("Missing authorization token");
      }

      const user = await verifyToken(token);
      if (!user) {
        set.status = 401;
        throw new Error("Invalid or expired token");
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        set.status = 403;
        throw new Error(`Access denied. Required role: ${roles.join(" or ")}`);
      }

      return { auth: user };
    });

// Convenience exports
export const requireCustomer = () => authPlugin("CUSTOMER", "OWNER", "ADMIN");
export const requireOwner = () => authPlugin("OWNER", "ADMIN");
export const requireAdmin = () => authPlugin("ADMIN");
