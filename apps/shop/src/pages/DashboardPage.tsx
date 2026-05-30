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

function StatCard({ icon, label, value, sub, color = "brand" }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-display font-bold text-white">{value}</div>
      <div className="text-sm font-medium text-gray-300">{label}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  CONFIRMED: "bg-green-500/20 text-green-400",
  COMPLETED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  NO_SHOW: "bg-gray-500/20 text-gray-400",
};

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
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${format(new Date(), "EEEE, dd MMMM yyyy")}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<CalendarCheck size={18} />} label="Today's Bookings" value={todayBookings.length} sub={`${confirmed} confirmed`} />
        <StatCard icon={<TrendingUp size={18} />} label="Total Revenue" value={`₹${(revenue / 100).toFixed(0)}`} sub="Cash at shop" color="green" />
        <StatCard icon={<Users size={18} />} label="Total Bookings" value={allBookings.length} color="blue" />
        <StatCard icon={<Star size={18} />} label="Rating" value="—" sub="No reviews yet" color="yellow" />
      </div>

      {/* Today's bookings */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white">Today's Schedule</h2>
          <Link to="/bookings" className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarCheck size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">No bookings today</p>
            <p className="text-gray-600 text-sm mt-1">Your schedule is clear</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-surface-border hover:border-surface-muted transition-colors">
                <div className="flex items-center gap-1.5 text-sm text-gray-400 w-28 flex-shrink-0">
                  <Clock size={13} />
                  <span>{booking.startTime} – {booking.endTime}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{booking.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {booking.services.map((s) => s.serviceName).join(", ")}
                    {booking.staff && ` • ${booking.staff.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">₹{(booking.totalAmount / 100).toFixed(0)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status] ?? "bg-gray-500/20 text-gray-400"}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
