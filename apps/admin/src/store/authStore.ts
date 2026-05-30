import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  setSession: (session: Session | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      loading: true,
      isAdmin: false,
      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
          loading: false,
          ...(!session ? { isAdmin: false } : {}),
        }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, isAdmin: false });
      },
    }),
    {
      name: "unisalon-admin-auth",
      partialize: (s) => ({ session: s.session, user: s.user, isAdmin: s.isAdmin }),
    }
  )
);
