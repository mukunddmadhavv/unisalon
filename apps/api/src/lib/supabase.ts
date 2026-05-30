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

  // Check if admin
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (adminEmails.includes(data.user.email ?? "")) {
    return { supabaseId: data.user.id, email: data.user.email!, role: "ADMIN" };
  }

  // Check shop owner
  const owner = await prisma.shopOwner.findUnique({
    where: { supabaseId: data.user.id },
    select: { id: true },
  });
  if (owner) {
    return { supabaseId: data.user.id, email: data.user.email!, role: "OWNER" };
  }

  // Default: customer
  return { supabaseId: data.user.id, email: data.user.email!, role: "CUSTOMER" };
}
