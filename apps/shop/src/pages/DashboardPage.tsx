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

interface BookingsResponse {
  data: Booking[];
}



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




  return (
    <div className="space-y-6">
      
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
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
          <span className={`ml-3 font-display text-xs font-extrabold tracking-wider uppercase peer-checked:text-rating-green ${isLive ? 'text-rating-green' : 'text-text-secondary'}`}>
            {isLive ? 'Live' : 'Offline'}
          </span>
        </label>
      </section>

      {/* Stats Cards (Stitch Style) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-border-light p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="material-symbols-outlined p-2 bg-surface-container rounded-lg text-primary">calendar_month</span>
            <span className="font-label-sm text-[10px] font-bold text-rating-green bg-offer-bg px-2 py-1 rounded">+12%</span>
          </div>
          <div className="mt-4">
            <p className="font-label-lg text-xs font-bold text-text-secondary">Bookings</p>
            <h4 className="font-headline-lg text-2xl font-black text-primary">{allBookings.length}</h4>
          </div>
        </div>
        {/* Metric 2 */}
        <div className="bg-white border border-border-light p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="material-symbols-outlined p-2 bg-surface-container rounded-lg text-primary">payments</span>
            <span className="font-label-sm text-[10px] font-bold text-rating-green bg-offer-bg px-2 py-1 rounded">+8%</span>
          </div>
          <div className="mt-4">
            <p className="font-label-lg text-xs font-bold text-text-secondary">Revenue</p>
            <h4 className="font-headline-lg text-2xl font-black text-primary">₹{(dailyRevenue / 100).toLocaleString()}</h4>
          </div>
        </div>
        {/* Metric 3 */}
        <div className="bg-white border border-border-light p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="material-symbols-outlined p-2 bg-surface-container rounded-lg text-primary">timer</span>
            <span className="font-label-sm text-[10px] font-bold text-text-secondary bg-surface-container px-2 py-1 rounded">-5m avg</span>
          </div>
          <div className="mt-4">
            <p className="font-label-lg text-xs font-bold text-text-secondary">Service Time</p>
            <h4 className="font-headline-lg text-2xl font-black text-primary">{avgServiceTime}m</h4>
          </div>
        </div>
        {/* Metric 4 */}
        <div className="bg-white border border-border-light p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="material-symbols-outlined p-2 bg-surface-container rounded-lg text-rating-green" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-label-sm text-[10px] font-bold text-rating-green bg-offer-bg px-2 py-1 rounded">Excellent</span>
          </div>
          <div className="mt-4">
            <p className="font-label-lg text-xs font-bold text-text-secondary">Customer Rating</p>
            <h4 className="font-headline-lg text-2xl font-black text-primary">{shopRating}</h4>
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Center Section: Active Sessions / Schedule (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-text-primary">Active Sessions</h3>
              <div className="flex gap-2">
                <span className="bg-offer-bg text-offer-text text-[10px] px-2.5 py-1 rounded-full font-sans font-bold uppercase border border-rating-green/20">
                  {confirmedToday.length} Confirmed Today
                </span>
              </div>
            </div>

            <div className="divide-y divide-border-light">
              {todayBookings.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">calendar_today</span>
                  <p className="font-sans text-sm font-bold text-text-primary">No appointments today</p>
                  <p className="font-sans text-xs text-text-secondary mt-1">Your schedule is currently clear for the day.</p>
                </div>
              ) : (
                todayBookings.map((booking) => (
                  <div key={booking.id} className="p-6 flex items-center justify-between group hover:bg-surface transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center font-display text-sm font-bold text-text-secondary">
                        {booking.user.name.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <h5 className="font-body-lg text-sm md:text-base font-bold text-primary">{booking.user.name}</h5>
                        <p className="text-xs text-text-secondary">
                          {booking.services.map((s) => s.serviceName).join(", ")} • <span className="text-primary font-bold">{booking.staff?.name || "Any Stylist"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-body-md text-xs font-bold text-primary">{booking.startTime}</p>
                      <div className="w-24 h-1 bg-surface-container rounded-full mt-2 overflow-hidden">
                        <div className={`h-full ${booking.status === "COMPLETED" ? "bg-rating-green" : "bg-primary"} w-full transition-all`}></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Pending Requests */}
        <aside className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-text-secondary">Pending Requests ({pendingBookings.length})</h3>
            {pendingBookings.length > 0 && (
              <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
            )}
          </div>

          <div className="space-y-4">
            {pendingBookings.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border-light rounded-xl bg-white shadow-sm">
                <span className="material-symbols-outlined text-3xl text-text-secondary mb-1">done_all</span>
                <p className="font-sans text-xs text-text-secondary font-semibold">No pending requests</p>
              </div>
            ) : (
              pendingBookings.map((booking) => (
                <div key={booking.id} className="bg-white border border-border-light p-4 rounded-xl shadow-sm space-y-3">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center font-display text-sm font-black text-text-secondary shrink-0">
                      {booking.user.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <h6 className="font-body-lg text-sm font-bold text-primary truncate">{booking.user.name}</h6>
                      <p className="font-body-sm text-xs text-text-secondary truncate">{booking.services.map((s) => s.serviceName).join(", ")}</p>
                      <p className="font-label-sm text-[10px] text-text-secondary mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {booking.date === today ? "Today" : booking.date}, {booking.startTime}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                      className="py-2 rounded-lg border border-border-light font-label-lg text-xs font-bold text-text-primary hover:bg-surface-container transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => statusMutation.mutate({ id: booking.id, status: "CONFIRMED" })}
                      className="py-2 rounded-lg bg-primary text-white font-label-lg text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

      </div>

      {/* Bento Section: Quick Actions & Alerts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-offer-bg border border-rating-green/20 p-6 rounded-xl relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <span className="material-symbols-outlined text-rating-green mb-2">auto_awesome</span>
            <h5 className="font-body-lg text-sm font-bold text-primary">Smart Suggestions</h5>
            <p className="font-body-sm text-xs text-text-secondary mt-2">Create custom deals and styling bundles to drive bookings during low-occupancy hours.</p>
            <Link to="/services" className="mt-4 inline-block px-4 py-2 bg-rating-green text-white rounded-lg font-label-lg text-xs font-bold shadow-sm">Manage Offers</Link>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-8xl">bolt</span>
          </div>
        </div>
        
        <div className="bg-white border border-border-light p-6 rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <span className="material-symbols-outlined text-primary mb-2">inventory_2</span>
            <h5 className="font-body-lg text-sm font-bold text-primary">Inventory Alert</h5>
            <p className="font-body-sm text-xs text-text-secondary mt-2">Items like Argan oils and styling waxes are running low. Tap to place supplies orders.</p>
          </div>
          <button className="mt-4 w-full py-2 border border-border-light rounded-lg font-label-lg text-xs font-bold hover:bg-surface-container transition-colors">Order Supplies</button>
        </div>

        <div className="bg-white border border-border-light p-6 rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <span className="material-symbols-outlined text-primary mb-2">badge</span>
            <h5 className="font-body-lg text-sm font-bold text-primary">Staff Onboarding</h5>
            <p className="font-body-sm text-xs text-text-secondary mt-2">Sync scheduling, bio pictures, and service categories for newly added stylists.</p>
          </div>
          <Link to="/staff" className="mt-4 w-full py-2 text-center border border-border-light rounded-lg font-label-lg text-xs font-bold hover:bg-surface-container transition-colors block">Setup Profiles</Link>
        </div>
      </section>

    </div>
  );
}
