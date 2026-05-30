import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Scissors, Users, CalendarCheck,
  Star, LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNotifications } from "../hooks/useNotifications";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/shop/edit", icon: Scissors, label: "My Shop" },
  { to: "/services", icon: Scissors, label: "Services" },
  { to: "/staff", icon: Users, label: "Staff" },
  { to: "/bookings", icon: CalendarCheck, label: "Bookings" },
  { to: "/reviews", icon: Star, label: "Reviews" },
];

export function Sidebar() {
  const { signOut, user } = useAuthStore();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-surface-card border-r border-surface-border flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✂️</span>
          <span className="font-display font-bold text-lg">
            <span className="text-brand-500">Uni</span>Salon
          </span>
          <span className="text-xs text-gray-500 ml-1">Shop</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
            {label === "Bookings" && unreadCount > 0 && (
              <span className="ml-auto bg-brand-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold">
            {user?.email?.[0]?.toUpperCase() ?? "O"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
            <p className="text-xs text-gray-500">Shop Owner</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
