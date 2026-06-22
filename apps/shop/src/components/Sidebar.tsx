import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Scissors, Users, CalendarCheck,
  Star, LogOut, Settings,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNotifications } from "../hooks/useNotifications";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/shop/edit",  icon: Settings,        label: "My Shop" },
  { to: "/services",   icon: Scissors,        label: "Services" },
  { to: "/staff",      icon: Users,           label: "Staff" },
  { to: "/bookings",   icon: CalendarCheck,   label: "Bookings" },
  { to: "/reviews",    icon: Star,            label: "Reviews" },
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
    <aside style={{
      width: 256, minHeight: "100vh",
      background: "#ffffff", borderRight: "1px solid #e4ebf3",
      display: "flex", flexDirection: "column",
      fontFamily: "'Montserrat', Arial, sans-serif",
    }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #e4ebf3" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#111111", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Scissors size={18} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 16, color: "#02060c", letterSpacing: "-0.3px" }}>UniSalon</span>
            <span style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", fontWeight: 600, marginLeft: 6 }}>Shop</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={{ textDecoration: "none", display: "block", marginBottom: 2 }}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={16} />
            <span>{label}</span>
            {label === "Bookings" && unreadCount > 0 && (
              <span style={{
                marginLeft: "auto", background: "#111111", color: "#ffffff",
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
              }}>
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "12px", borderTop: "1px solid #e4ebf3" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px", borderRadius: 14,
          background: "#f5f7fa",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#111111", color: "#ffffff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14,
          }}>
            {user?.email?.[0]?.toUpperCase() ?? "O"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#02060c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </p>
            <p style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", fontWeight: 600 }}>Shop Owner</p>
          </div>
          <button
            onClick={handleSignOut}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(2,6,12,0.35)", padding: 4 }}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
