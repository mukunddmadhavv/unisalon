import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  user: { name: string; email: string; phone?: string };
  staff: { name: string } | null;
  staffId?: string;
  services: Array<{ serviceName: string; durationMins: number }>;
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

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-secondary-container text-on-secondary-container border border-on-secondary-container/20",
  CONFIRMED: "bg-offer-bg text-offer-text border border-rating-green/20",
  COMPLETED: "bg-blue-50 text-blue-700 border border-blue-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
  NO_SHOW: "bg-gray-50 text-gray-700 border border-gray-200",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const ownerName = user?.email?.split("@")[0] ?? "Owner";

  // Visual Live Status Toggle
  const [isLive, setIsLive] = useState(() => {
    const saved = localStorage.getItem("shop-live-status");
    return saved === null ? true : saved === "true";
  });

  const handleLiveToggle = () => {
    const nextState = !isLive;
    setIsLive(nextState);
    localStorage.setItem("shop-live-status", String(nextState));
    toast.success(nextState ? "Salon is now Live for bookings!" : "Salon is now Offline.");
  };

  // Queries
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

  const { data: shopDetail } = useQuery<any>({
    queryKey: ["owner-shop"],
    queryFn: () => api.getShop(),
  });

  // Booking accept/decline mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateBookingStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-bookings"] });
      toast.success("Appointment updated successfully");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update status"),
  });

  const pendingBookings = allBookings.filter((b) => b.status === "PENDING");
  const confirmedToday = todayBookings.filter((b) => b.status === "CONFIRMED");
  const completedBookings = allBookings.filter((b) => b.status === "COMPLETED");

  // Stats calculations
  const dailyRevenue = todayBookings
    .filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const avgServiceTime = completedBookings.length > 0
    ? Math.round(
        completedBookings.reduce(
          (sum, b) => sum + b.services.reduce((sSum, s) => sSum + s.durationMins, 0),
          0
        ) / completedBookings.length
      )
    : 45;

  const shopRating = shopDetail?.data?.rating ?? 4.9;

  const getStaffRevenue = (staffId: string) => {
    return allBookings
      .filter((b) => b.status === "COMPLETED" && b.staffId === staffId)
      .reduce((s, b) => s + b.totalAmount, 0) / 100;
  };

  const sortedStaff = [...staffList]
    .map((s) => ({ ...s, revenue: getStaffRevenue(s.id) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-text-primary tracking-tight">
            Luxe Salon Central
          </h1>
          <p className="font-sans text-xs text-text-secondary mt-1">
            Welcome back, {ownerName.charAt(0).toUpperCase() + ownerName.slice(1)} • Today is {format(new Date(), "MMMM dd, yyyy")}
          </p>
        </div>
      </section>

      {/* Shop Availability Live/Offline Toggle */}
      <section className="bg-white border border-border-light p-4 rounded-xl flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-sans text-sm font-bold text-text-primary">Shop Availability</h2>
          <p className="font-sans text-xs text-text-secondary mt-0.5">Toggle your salon visibility on customer explorer</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isLive}
            onChange={handleLiveToggle}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rating-green"></div>
          <span className={`ml-3 font-display text-xs font-extrabold tracking-wider uppercase ${isLive ? 'text-rating-green' : 'text-text-secondary'}`}>
            {isLive ? 'Live' : 'Offline'}
          </span>
        </label>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border-light p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
          <span className="material-symbols-outlined text-text-secondary text-[20px]">calendar_today</span>
          <span className="font-display text-2xl font-black text-text-primary">{allBookings.length}</span>
          <span className="font-sans text-[11px] font-semibold text-text-secondary">Total Bookings</span>
        </div>
        <div className="bg-white border border-border-light p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
          <span className="material-symbols-outlined text-rating-green text-[20px]">payments</span>
          <span className="font-display text-2xl font-black text-text-primary">₹{(dailyRevenue / 100).toLocaleString()}</span>
          <span className="font-sans text-[11px] font-semibold text-text-secondary">Daily Revenue</span>
        </div>
        <div className="bg-white border border-border-light p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
          <span className="material-symbols-outlined text-[#fed65b] text-[20px]">schedule</span>
          <span className="font-display text-2xl font-black text-text-primary">{avgServiceTime}m</span>
          <span className="font-sans text-[11px] font-semibold text-text-secondary">Avg. Service Time</span>
        </div>
        <div className="bg-white border border-border-light p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
          <span className="material-symbols-outlined text-primary text-[20px]">star</span>
          <span className="font-display text-2xl font-black text-text-primary">{shopRating}</span>
          <span className="font-sans text-[11px] font-semibold text-text-secondary">Today's Rating</span>
        </div>
      </section>

      {/* Main Dashboard Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Section: Pending Requests & Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Requests Section */}
          <section className="bg-white border border-border-light rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-text-secondary">Pending Requests</h3>
                <p className="font-sans text-xs text-text-secondary mt-0.5">{pendingBookings.length} bookings waiting</p>
              </div>
              <Link to="/bookings" className="text-primary font-sans text-xs font-bold border-b border-primary hover:opacity-80 transition-opacity">
                View All
              </Link>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border-light rounded-xl bg-background">
                <span className="material-symbols-outlined text-3xl text-text-secondary mb-1">done_all</span>
                <p className="font-sans text-xs text-text-secondary font-semibold">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="border border-border-light p-4 rounded-xl shadow-sm bg-background transition-transform duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-border-light flex items-center justify-center font-display text-sm font-extrabold text-primary shadow-sm flex-shrink-0">
                          {booking.user.name[0]}
                        </div>
                        <div>
                          <h4 className="font-sans text-sm font-bold text-text-primary">{booking.user.name}</h4>
                          <p className="font-sans text-xs text-text-secondary truncate mt-0.5">
                            {booking.services.map((s) => s.serviceName).join(", ")}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-primary">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span className="font-display text-[11px] font-extrabold">
                              {booking.date === today ? "Today" : booking.date}, {booking.startTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                      <button
                        onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                        className="py-2 border border-border-light rounded-lg font-sans text-xs font-bold text-text-primary hover:bg-surface-container transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: booking.id, status: "CONFIRMED" })}
                        className="py-2 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Today's Schedule timeline */}
          <section className="bg-white border border-border-light rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-text-secondary">Today's Schedule</h3>
              <span className="bg-offer-bg text-offer-text text-[10px] px-2 py-0.5 rounded-full font-sans font-bold uppercase border border-rating-green/20">
                {confirmedToday.length} Confirmed
              </span>
            </div>

            <div className="space-y-3">
              {todayBookings.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">calendar_today</span>
                  <p className="font-sans text-sm font-bold text-text-primary">No appointments today</p>
                  <p className="font-sans text-xs text-text-secondary mt-1">Your schedule is currently clear for the day.</p>
                </div>
              ) : (
                todayBookings.map((booking) => (
                  <div key={booking.id} className="border border-border-light rounded-xl p-4 flex gap-4 bg-background hover:bg-white transition-colors shadow-sm">
                    <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-border-light pr-4">
                      <span className="font-display text-lg font-black text-text-primary">
                        {booking.startTime.split(":")[0]}
                      </span>
                      <span className="font-sans text-[10px] font-bold text-text-secondary uppercase">
                        {Number(booking.startTime.split(":")[0]) >= 12 ? "PM" : "AM"}
                      </span>
                    </div>
                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <div className="min-w-0 pr-2">
                        <span className="font-sans text-sm font-bold text-text-primary truncate block">{booking.user.name}</span>
                        <span className="font-sans text-xs text-text-secondary truncate block mt-0.5">
                          {booking.services.map((s) => s.serviceName).join(", ")}
                          {booking.staff && ` with ${booking.staff.name}`}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-sans text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${STATUS_COLORS[booking.status]}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

        {/* Right Section: Top Stylists & Quick Support */}
        <div className="space-y-6">
          
          {/* Top Stylists Leaderboard */}
          <section className="bg-white border border-border-light rounded-xl p-5 shadow-sm">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-text-secondary mb-4">Top Stylists</h3>
            {sortedStaff.length === 0 ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-3xl text-text-secondary mb-1">group</span>
                <p className="font-sans text-xs text-text-secondary font-semibold">No staff listed yet</p>
                <Link to="/staff" className="text-primary text-xs font-bold hover:underline block mt-2">
                  Add Staff Members
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {sortedStaff.map((staff, idx) => (
                  <div key={staff.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[10px] font-black ${
                        idx === 0 ? "bg-primary text-white" : "bg-surface-container-high text-text-secondary"
                      }`}>
                        {idx + 1}
                      </div>
                      <p className="font-sans text-sm font-bold text-text-primary">{staff.name}</p>
                    </div>
                    <p className="font-display text-sm font-extrabold text-primary">₹{staff.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Micro-interaction support banner */}
          <section className="bg-white border border-dashed border-border-light rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="font-sans text-sm font-bold text-text-primary">Need help with UniSalon?</p>
              <p className="font-sans text-xs text-text-secondary mt-1 leading-relaxed">
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
          </section>

        </div>

      </div>
    </div>
  );
}
