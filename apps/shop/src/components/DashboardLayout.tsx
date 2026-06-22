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
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
      <div>
        <h1 style={{
          fontFamily: "'Montserrat', Arial, sans-serif",
          fontSize: 26, fontWeight: 900, color: "#02060c", letterSpacing: "-0.5px",
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", fontWeight: 600, marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {actions}
        <NotificationBell />
      </div>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#f5f7fa", fontFamily: "'Montserrat', Arial, sans-serif",
    }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
