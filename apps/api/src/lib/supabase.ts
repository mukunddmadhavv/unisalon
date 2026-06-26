import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

// Server-side admin client (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Anonymous client for token verification
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────
// JWT Verification helper
// ─────────────────────────────────────────────

export type AuthUser = {
  supabaseId: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "OWNER";
};

/**
 * Verify Supabase JWT and look up user role from DB
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { prisma } = await import("@unisalon/db");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  const isAdmin = adminEmails.includes(data.user.email ?? "");

  // Check shop owner or auto-create if owner metadata exists
  let owner = await prisma.shopOwner.findUnique({
    where: { supabaseId: data.user.id },
    select: { id: true },
  });

  if (!owner && data.user.user_metadata?.role === "OWNER") {
    try {
      const newOwner = await prisma.shopOwner.create({
        data: {
          supabaseId: data.user.id,
          email: data.user.email ?? "",
          name: data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "Shop Owner",
          phone: data.user.user_metadata?.phone ?? "0000000000",
        },
      });
      owner = { id: newOwner.id };
    } catch (e) {
      console.error("Failed to auto-create shop owner on token verification:", e);
    }
  }

  if (owner) {
    return { supabaseId: data.user.id, email: data.user.email!, role: "OWNER" };
  }

  // Check customer/admin or auto-create
  let customer = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
    select: { id: true },
  });

  if (!customer) {
    try {
      await prisma.user.create({
        data: {
          supabaseId: data.user.id,
          email: data.user.email ?? "",
          name: data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? (isAdmin ? "Admin" : "Customer"),
          phone: data.user.user_metadata?.phone ?? null,
          role: isAdmin ? "ADMIN" : "CUSTOMER",
        },
      });
    } catch (e) {
      console.error("Failed to auto-create user on token verification:", e);
    }
  }

  if (isAdmin) {
    return { supabaseId: data.user.id, email: data.user.email!, role: "ADMIN" };
  }

  // Default: customer
  return { supabaseId: data.user.id, email: data.user.email!, role: "CUSTOMER" };
}

