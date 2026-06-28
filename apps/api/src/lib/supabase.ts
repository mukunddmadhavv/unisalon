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
// JWT Verification helper (Clerk)
// ─────────────────────────────────────────────

import { verifyToken as clerkVerifyToken, createClerkClient } from "@clerk/backend";

const clerkSecretKey = process.env.CLERK_SECRET_KEY!;
if (!clerkSecretKey) {
  throw new Error("Missing CLERK_SECRET_KEY environment variable");
}

export const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

export type AuthUser = {
  supabaseId: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "OWNER";
};

/**
 * Verify Clerk JWT and look up user role from DB
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = await clerkVerifyToken(token, {
      secretKey: clerkSecretKey,
    });
    if (!payload || !payload.sub) return null;

    const userId = payload.sub;

    const { prisma } = await import("@unisalon/db");

    // Fetch user details from Clerk API
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email.split("@")[0] || "User";
    const phone = clerkUser.phoneNumbers[0]?.phoneNumber ?? null;

    // Check if user is an admin by email
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
    let isAdmin = adminEmails.includes(email);

    if (!isAdmin) {
      const dbAdmin = await prisma.allowedAdminEmail.findUnique({
        where: { email },
      });
      if (dbAdmin) {
        isAdmin = true;
      }
    }

    // Read the role from Clerk metadata if present
    const roleFromMetadata = clerkUser.publicMetadata?.role as string | undefined;

    // If user is an admin, return ADMIN role immediately (highest privilege)
    if (isAdmin || roleFromMetadata === "ADMIN") {
      return { supabaseId: userId, email: email, role: "ADMIN" };
    }

    // Check shop owner
    let owner = await prisma.shopOwner.findUnique({
      where: { supabaseId: userId },
      select: { id: true },
    });

    if (!owner && (roleFromMetadata === "OWNER" || email.includes("owner") || clerkUser.publicMetadata?.isOwner)) {
      try {
        const newOwner = await prisma.shopOwner.create({
          data: {
            supabaseId: userId,
            email: email,
            name: name,
            phone: phone ?? "0000000000",
          },
        });
        owner = { id: newOwner.id };
      } catch (e) {
        console.error("Failed to auto-create shop owner on token verification:", e);
      }
    }

    if (owner || roleFromMetadata === "OWNER") {
      return { supabaseId: userId, email: email, role: "OWNER" };
    }

    // Check customer/admin or auto-create
    let customer = await prisma.user.findUnique({
      where: { supabaseId: userId },
      select: { id: true },
    });

    if (!customer) {
      try {
        await prisma.user.create({
          data: {
            supabaseId: userId,
            email: email,
            name: name,
            phone: phone,
            role: "CUSTOMER", // User is not an admin if they reached here
          },
        });
      } catch (e) {
        console.error("Failed to auto-create user on token verification:", e);
      }
    }

    // Default: customer
    return { supabaseId: userId, email: email, role: "CUSTOMER" };
  } catch (err) {
    console.error("Clerk token verification failed:", err);
    return null;
  }
}


