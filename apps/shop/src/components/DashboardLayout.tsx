import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { useUser, useClerk } from "@clerk/react";
import { useNotifications } from "../hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const mobileLinks = [
  { to: "/dashboard", icon: "dashboard", label: "Home" },
  { to: "/bookings",   icon: "calendar_today", label: "Bookings" },
  { to: "/services",   icon: "content_cut", label: "Services" },
  { to: "/staff",      icon: "group", label: "Staff" },
  { to: "/shop/edit",  icon: "storefront", label: "Profile" },
];

export function PageHeader({ title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-background tracking-tight">{title}</h2>
        {subtitle && (
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export function DashboardLayout() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [claimCode, setClaimCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: shopResponse, isLoading, refetch } = useQuery<any>({
    queryKey: ["owner-shop"],
    queryFn: () => api.getShop(),
  });

  const { unreadCount } = useNotifications();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const shop = shopResponse?.data ?? shopResponse;

  if (!shop) {
    const handleClaimSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!claimCode.trim()) return;
      setSubmitting(true);
      try {
        await api.claimShop(claimCode);
        toast.success("Salon claimed successfully! Setting up your dashboard...");
        await refetch();
      } catch (err: any) {
        toast.error(err.message || "Failed to claim salon. Please check the code.");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
        <div className="w-full max-w-md bg-white border border-border-light rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <h1 className="font-display text-2xl font-black text-text-primary tracking-tight">Activate Partner Salon</h1>
            <p className="text-xs text-text-secondary px-2">
              Claim a visited salon account using your invitation code, or set up a brand new profile from scratch.
            </p>
          </div>

          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                Invitation Activation Code
              </label>
              <input
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                placeholder="e.g. US-XXXXXX"
                className="w-full px-4 py-2.5 bg-surface-container border border-border-light rounded-xl font-headline font-bold text-center tracking-widest text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-secondary placeholder:tracking-normal placeholder:font-sans placeholder:font-normal"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-white rounded-xl font-label-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              {submitting ? "Activating..." : "Activate Account"}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border-light"></div>
            <span className="flex-shrink mx-4 text-[10px] text-text-secondary font-bold uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-border-light"></div>
          </div>

          <button
            onClick={() => navigate("/register")}
            className="w-full py-3 border border-border-light text-text-primary rounded-xl font-label-lg font-bold text-sm hover:bg-surface transition-colors"
          >
            Register New Salon Profile
          </button>

          <div className="text-center pt-2">
            <button
              onClick={() => signOut().then(() => navigate("/auth/login"))}
              className="text-xs text-text-secondary hover:text-error hover:underline transition-colors flex items-center gap-1.5 mx-auto font-semibold"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign out from account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopAppBar */}
        <header className="flex justify-between items-center px-4 sm:px-6 md:px-10 h-20 w-full z-40 bg-white border-b border-border-light shadow-sm sticky top-0">
          <div className="flex items-center gap-8">
            <span className="font-display text-base sm:text-lg font-bold text-primary truncate">Unisalon Shop Manager</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
            <div className="h-8 w-[1px] bg-border-light hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-sans text-sm font-bold text-text-primary">{user?.primaryEmailAddress?.emailAddress?.split("@")[0]}</p>
                <p className="font-sans text-xs text-text-secondary">Shop Owner</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm border border-border-light">
                {user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ?? "O"}
              </div>
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-grow p-4 sm:p-6 md:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto w-full">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-light px-4 py-2.5 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          {mobileLinks.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 font-sans text-[10px] font-semibold transition-colors relative ` +
                (isActive ? "text-primary font-bold" : "text-text-secondary hover:text-primary")
              }
            >
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
              <span>{label}</span>
              {label === "Bookings" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
