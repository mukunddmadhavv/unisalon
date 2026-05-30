import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, ClipboardList, Users, ShieldAlert, LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/approvals", icon: ShieldCheck, label: "Approvals" },
  { to: "/shops", icon: ClipboardList, label: "Shops" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/logs", icon: ShieldAlert, label: "Admin Logs" },
];

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { signOut, user } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="w-64 min-h-screen bg-surface-card border-r border-surface-border flex flex-col shrink-0">
        {/* Brand logo */}
        <div className="px-6 py-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-lg">
              <span className="text-brand-500">Uni</span>Salon
            </span>
            <span className="text-xs bg-brand-500/10 text-brand-400 font-semibold px-2 py-0.5 rounded-full ml-1">
              Admin
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
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
            </NavLink>
          ))}
        </nav>

        {/* Admin user context & Log out */}
        <div className="p-3 border-t border-surface-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
