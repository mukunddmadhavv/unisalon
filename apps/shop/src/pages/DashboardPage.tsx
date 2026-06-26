import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  user: { name: string; email: string };
  staff: { name: string } | null;
  staffId?: string;
  services: Array<{ serviceName: string }>;
}

interface StaffMember {
  id: string;
  name: string;
  photoUrl?: string;
  specialization?: string;
  experience?: string;
  isActive: boolean;
}

interface BookingsResponse {
  data: Booking[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: "rgba(168, 51, 0, 0.1)", color: "#a83300" }, // Burnt Orange
  CONFIRMED: { bg: "rgba(183, 18, 42, 0.1)", color: "#b7122a" }, // Crimson Red
  COMPLETED: { bg: "rgba(22, 163, 74, 0.1)", color: "#16a34a" }, // Green
  CANCELLED: { bg: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }, // Red
  NO_SHOW:   { bg: "rgba(107, 114, 128, 0.1)", color: "#6b7280" },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const today = format(new Date(), "yyyy-MM-dd");
  const ownerName = user?.email?.split("@")[0] ?? "Owner";

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

  const { data: staffList = [] } = useQuery<StaffMember[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await api.getStaff() as any;
      return res.data ?? res;
    },
  });

  const confirmedToday = todayBookings.filter((b) => b.status === "CONFIRMED").length;
  const revenue = allBookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Helper to calculate stylist revenue
  const getStaffRevenue = (staffId: string) => {
    const sum = allBookings
      .filter((b) => b.status === "COMPLETED" && b.staffId === staffId)
      .reduce((s, b) => s + b.totalAmount, 0);
    return sum / 100; // in Rupees
  };

  // Sort staff by revenue
  const sortedStaff = [...staffList]
    .map((s) => ({ ...s, revenue: getStaffRevenue(s.id) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-on-background tracking-tight">
            Welcome back, {ownerName.charAt(0).toUpperCase() + ownerName.slice(1)}
          </h1>
          <p className="font-sans text-base text-on-surface-variant mt-1">
            Here is what's happening at your salon today, {format(new Date(), "MMMM dd, yyyy")}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/bookings"
            className="px-5 py-2.5 border border-surface-container-high text-on-surface rounded-xl font-sans font-semibold text-sm flex items-center gap-2 hover:bg-surface-container-low transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            Daily Report
          </Link>
          <Link
            to="/shop/edit"
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-sans font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Book Appointment
          </Link>
        </div>
      </section>

      {/* Quick Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Card 1: Total Sales */}
        <div className="glass-card vibrant-hover overflow-hidden relative group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start z-10">
            <span className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Total Sales</span>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="z-10">
            <p className="font-display text-3xl font-extrabold text-on-background">₹{(revenue / 100).toLocaleString()}</p>
            <p className="font-sans text-xs text-secondary flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              +12% vs last week
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 scale-125 transition-opacity text-on-surface-variant pointer-events-none select-none">
            <span className="material-symbols-outlined text-[120px]">monitoring</span>
          </div>
        </div>

        {/* Card 2: Upcoming Appointments */}
        <div className="glass-card vibrant-hover overflow-hidden relative group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start z-10">
            <span className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Upcoming Appointments</span>
            <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
          </div>
          <div className="z-10">
            <p className="font-display text-3xl font-extrabold text-on-background">{todayBookings.length}</p>
            <p className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">{confirmedToday} confirmed for today</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 scale-125 transition-opacity text-on-surface-variant pointer-events-none select-none">
            <span className="material-symbols-outlined text-[120px]">event_available</span>
          </div>
        </div>

        {/* Card 3: Total Bookings */}
        <div className="glass-card vibrant-hover overflow-hidden relative group flex flex-col justify-between h-40">
          <div className="flex justify-between items-start z-10">
            <span className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Total Bookings</span>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <span className="material-symbols-outlined">star</span>
            </div>
          </div>
          <div className="z-10">
            <p className="font-display text-3xl font-extrabold text-on-background">{allBookings.length}</p>
            <p className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">Booked across all days</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 scale-125 transition-opacity text-on-surface-variant pointer-events-none select-none">
            <span className="material-symbols-outlined text-[120px]">stars</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Layout (Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left pane: Today's schedule + Banner */}
        <section className="lg:col-span-2 space-y-6">
          <div className="glass-card !p-0 overflow-hidden">
            <div className="p-6 border-b border-surface-container-high flex justify-between items-center bg-transparent">
              <h3 className="font-display text-lg font-bold text-on-background">Today's Schedule</h3>
              <Link to="/bookings" className="text-primary font-sans font-semibold text-sm hover:underline">
                View All Bookings
              </Link>
            </div>
            <div className="divide-y divide-surface-container-high bg-transparent">
              {todayBookings.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-3">calendar_today</span>
                  <p className="font-display text-base font-bold text-on-background">No appointments today</p>
                  <p className="font-sans text-xs text-on-surface-variant mt-1">Your schedule is currently clear for the day.</p>
                </div>
              ) : (
                todayBookings.map((booking) => {
                  const style = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
                  return (
                    <div key={booking.id} className="p-6 flex items-center gap-4 hover:bg-surface-container-low transition-all duration-150">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px]">event_available</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-sm text-on-background truncate">{booking.user.name}</p>
                        <p className="font-sans text-xs text-on-surface-variant truncate">
                          {booking.services.map((s) => s.serviceName).join(", ")}
                          {booking.staff && ` with ${booking.staff.name}`}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <p className="font-sans font-bold text-xs text-on-surface-variant whitespace-nowrap">
                          {booking.startTime} – {booking.endTime}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Visual Asset / Banner */}
          <div className="relative h-64 rounded-2xl overflow-hidden group shadow-md border border-surface-container-high">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10"></div>
            <img
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Salon interior banner"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPhPjmvnrwBeXHcoCysRr8sKv5nXfudheuTWi-RfV5dw6Z-oOPF8h932-kvkv8bocjlvW5ZC1kPfvn7wdCrHo4pmtrAz2awnhcTlPM5Q8gd6_vZM0p7LGZrpX2k5Xz9OYTeK5evSSOyg797vicgadjVoXwtywtVj-veZduVn4h3_RCje_L97mInUAI6nbCbEQXMo5PvDnb_rQMK7EHTlLH3KerT2Z1WPAHoSL_pBedOxv53UFsLr1Ri8yPz63A6_D3i_nSbmwWxDng"
            />
            <div className="relative z-20 h-full flex flex-col justify-center px-10">
              <h4 className="font-display text-2xl font-extrabold text-white max-w-sm">Elevate your customer experience.</h4>
              <p className="text-white/80 mt-2 font-sans text-sm max-w-xs leading-relaxed">
                Manage your services, pricing, and operating hours to keep your salon page attractive for booking.
              </p>
              <Link
                to="/shop/edit"
                className="mt-5 w-fit px-6 py-2.5 bg-white text-primary hover:bg-primary hover:text-white rounded-full font-sans text-xs font-bold transition-all duration-250 shadow-md"
              >
                Manage Profile
              </Link>
            </div>
          </div>
        </section>

        {/* Right pane: Top stylists + Support */}
        <section className="space-y-6">
          {/* Stylists Leaderboard */}
          <div className="glass-card">
            <h3 className="font-display text-base font-bold text-on-background mb-4">Top Stylists</h3>
            {sortedStaff.length === 0 ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-3xl text-outline mb-1">group</span>
                <p className="font-sans text-xs text-on-surface-variant">No staff listed yet</p>
                <Link to="/staff" className="text-primary text-xs font-bold hover:underline block mt-2">
                  Add Staff Members
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedStaff.map((staff, idx) => (
                  <div key={staff.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
                      }`}>
                        {idx + 1}
                      </div>
                      <p className="font-sans text-sm font-bold text-on-background">{staff.name}</p>
                    </div>
                    <p className="font-sans text-sm font-bold text-primary">₹{staff.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Support Card */}
          <div className="glass-card border-dashed border-2 border-surface-container-high flex flex-col justify-between">
            <div>
              <p className="font-sans font-bold text-sm text-on-background">Need help with UniSalon?</p>
              <p className="font-sans text-xs text-on-surface-variant mt-1 leading-relaxed">
                Our shop success team is available 24/7 to help you grow your salon business.
              </p>
            </div>
            <a
              href="mailto:support@unisalon.in"
              className="mt-4 flex items-center gap-1.5 text-primary font-sans text-xs font-bold hover:gap-2.5 transition-all w-fit"
            >
              Contact Support
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
