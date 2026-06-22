import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarCheck, Clock, Users, Star, TrendingUp, ArrowRight } from "lucide-react";
import { PageHeader } from "../components/DashboardLayout";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  user: { name: string; email: string };
  staff: { name: string } | null;
  services: Array<{ serviceName: string }>;
}

interface BookingsResponse {
  data: Booking[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: "#fff8e1", color: "#b45309" },
  CONFIRMED: { bg: "#f0fdf4", color: "#166534" },
  COMPLETED: { bg: "#eff6ff", color: "#1e40af" },
  CANCELLED: { bg: "#fef2f2", color: "#991b1b" },
  NO_SHOW:   { bg: "#f9fafb", color: "#6b7280" },
};

function StatCard({ icon, label, value, sub, iconBg = "#f5f7fa" }: {
  icon: React.ReactNode; label: string;
  value: string | number; sub?: string; iconBg?: string;
}) {
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e4ebf3",
      borderRadius: 20, padding: "20px 24px",
      fontFamily: "'Montserrat', Arial, sans-serif",
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        {icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#02060c", letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#02060c", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", marginTop: 3, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayBookings = [] } = useQuery<Booking[]>({
    queryKey: ["owner-bookings", "today"],
    queryFn: async () => {
      const res = await api.getOwnerBookings({ date: today }) as BookingsResponse;
      return res.data ?? res;
    },
  });

  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ["owner-bookings", "all"],
    queryFn: async () => {
      const res = await api.getOwnerBookings() as BookingsResponse;
      return res.data ?? res;
    },
  });

  const confirmed = todayBookings.filter((b) => b.status === "CONFIRMED").length;
  const revenue = allBookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div style={{ fontFamily: "'Montserrat', Arial, sans-serif" }}>
      <PageHeader
        title="Dashboard"
        subtitle={format(new Date(), "EEEE, dd MMMM yyyy")}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={<CalendarCheck size={18} color="#111111" />} label="Today's Bookings" value={todayBookings.length} sub={`${confirmed} confirmed`} />
        <StatCard icon={<TrendingUp size={18} color="#16a34a" />} label="Total Revenue" value={`₹${(revenue / 100).toFixed(0)}`} sub="Cash at shop" iconBg="#f0fdf4" />
        <StatCard icon={<Users size={18} color="#1e40af" />} label="Total Bookings" value={allBookings.length} iconBg="#eff6ff" />
        <StatCard icon={<Star size={18} color="#b45309" />} label="Rating" value="—" sub="No reviews yet" iconBg="#fff8e1" />
      </div>

      {/* Today's Schedule */}
      <div style={{ background: "#ffffff", border: "1px solid #e4ebf3", borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 800, fontSize: 16, color: "#02060c" }}>
            Today's Schedule
          </h2>
          <Link to="/bookings" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#111111", textDecoration: "none" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <CalendarCheck size={32} style={{ color: "rgba(2,6,12,0.2)", display: "block", margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#02060c" }}>No bookings today</p>
            <p style={{ fontSize: 13, color: "rgba(2,6,12,0.4)", marginTop: 6 }}>Your schedule is clear.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayBookings.map((booking) => {
              const s = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
              return (
                <div key={booking.id} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 16px", borderRadius: 14,
                  background: "#f5f7fa", border: "1px solid #e4ebf3",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(2,6,12,0.55)", width: 112, flexShrink: 0 }}>
                    <Clock size={13} />
                    {booking.startTime} – {booking.endTime}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#02060c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {booking.user.name}
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {booking.services.map((s) => s.serviceName).join(", ")}
                      {booking.staff && ` · ${booking.staff.name}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#02060c" }}>₹{(booking.totalAmount / 100).toFixed(0)}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                      background: s.bg, color: s.color,
                    }}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
