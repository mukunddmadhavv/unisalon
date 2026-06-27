import { NavLink, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { useNotifications } from "../hooks/useNotifications";

const links = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/shop/edit",  icon: "storefront", label: "Shop Profile" },
  { to: "/services",   icon: "content_cut", label: "Services" },
  { to: "/staff",      icon: "group", label: "Staff" },
  { to: "/bookings",   icon: "calendar_today", label: "Bookings" },
  { to: "/reviews",    icon: "star", label: "Reviews" },
];

export function Sidebar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <aside className="hidden md:flex w-64 h-screen sticky left-0 top-0 bg-white border-r border-border-light flex-col py-6 z-50 select-none">
      {/* Brand */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
        </div>
        <div>
          <h1 className="font-display text-lg font-black text-primary leading-none">
            UniSalon
          </h1>
          <p className="font-sans text-[10px] uppercase tracking-wider text-text-secondary opacity-70 mt-0.5">Shop Manager Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg font-sans text-sm font-semibold transition-all duration-200 hover:translate-x-1 ` +
              (isActive 
                ? "bg-primary text-white font-bold shadow-sm" 
                : "text-text-secondary hover:bg-surface-container hover:text-primary")
            }
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            <span className="flex-1">{label}</span>
            {label === "Bookings" && unreadCount > 0 && (
              <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info at bottom */}
      <div className="px-3 pt-4 border-t border-border-light mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border-light">
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ?? "O"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-primary truncate">
              {user?.primaryEmailAddress?.emailAddress?.split("@")[0]}
            </p>
            <p className="text-[10px] text-text-secondary font-semibold">Shop Owner</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 hover:bg-surface-container rounded-full text-text-secondary hover:text-error transition-all duration-150 active:scale-90"
            title="Sign out"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
