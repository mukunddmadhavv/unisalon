import { Outlet, NavLink } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { useAuthStore } from "../store/authStore";
import { useNotifications } from "../hooks/useNotifications";

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
  const { user } = useAuthStore();
  const { unreadCount } = useNotifications();

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
                <p className="font-sans text-sm font-bold text-text-primary">{user?.email?.split("@")[0]}</p>
                <p className="font-sans text-xs text-text-secondary">Shop Owner</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm border border-border-light">
                {user?.email?.[0]?.toUpperCase() ?? "O"}
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
