import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, ClipboardList, Users, ShieldAlert, LogOut, Scissors,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/react";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/approvals", icon: ShieldCheck,    label: "Approvals" },
  { to: "/shops",     icon: ClipboardList,  label: "Shops" },
  { to: "/users",     icon: Users,          label: "Users" },
  { to: "/logs",      icon: ShieldAlert,    label: "Admin Logs" },
];

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 26, fontWeight: 900, color: "#02060c", letterSpacing: "-0.5px" }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", fontWeight: 600, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{actions}</div>}
    </div>
  );
}

export function AdminLayout() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fa", fontFamily: "'Montserrat', Arial, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 256, minHeight: "100vh", background: "#ffffff", borderRight: "1px solid #e4ebf3", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #e4ebf3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#111111", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scissors size={18} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: 16, color: "#02060c" }}>UniSalon</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
                background: "#111111", color: "#ffffff",
                borderRadius: 6, padding: "2px 7px", marginLeft: 6,
              }}>
                ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px" }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={{ textDecoration: "none", display: "block", marginBottom: 2 }}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: "12px", borderTop: "1px solid #e4ebf3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: "#f5f7fa" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#111111", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
              {user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#02060c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.primaryEmailAddress?.emailAddress}</p>
              <p style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", fontWeight: 600 }}>Administrator</p>
            </div>
            <button onClick={handleSignOut} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(2,6,12,0.35)", padding: 4, flexShrink: 0 }} title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
