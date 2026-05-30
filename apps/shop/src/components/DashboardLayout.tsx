import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <NotificationBell />
      </div>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
