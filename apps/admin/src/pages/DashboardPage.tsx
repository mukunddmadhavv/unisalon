import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/AdminLayout";
import { api } from "../lib/api";
import {
  Store, Users, CalendarCheck, ShieldAlert, Award, TrendingUp, Clock
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { Link } from "react-router-dom";

interface StatsData {
  pendingShops: number;
  totalShops: number;
  totalUsers: number;
  totalBookings: number;
  todayBookings: number;
  totalOwners: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<StatsData>({
    queryKey: ["admin-stats"],
    queryFn: () => api.getStats(),
    refetchInterval: 15000,
  });

  const chartData = [
    { name: "Mon", bookings: 12 },
    { name: "Tue", bookings: 19 },
    { name: "Wed", bookings: 15 },
    { name: "Thu", bookings: 27 },
    { name: "Fri", bookings: 32 },
    { name: "Sat", bookings: 45 },
    { name: "Sun", bookings: stats?.todayBookings ?? 38 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 border-red-500/20 bg-red-500/5 text-center my-8">
        <p className="text-red-400 font-medium">Failed to load platform stats</p>
        <p className="text-gray-500 text-sm mt-1">{error instanceof Error ? error.message : "Network error"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Real-time monitoring of UniSalon partner listings, bookings, and user growth."
      />

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <Link to="/approvals" className="stat-card hover:border-brand-500/50 transition-colors group relative overflow-hidden">
          {stats && stats.pendingShops > 0 && (
            <span className="absolute top-4 right-4 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-500"></span>
            </span>
          )}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
              <ShieldAlert size={22} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Pending Approvals</p>
              <h3 className="text-3xl font-bold font-display text-white mt-1">{stats?.pendingShops}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 group-hover:text-brand-400 transition-colors flex items-center gap-1">
            <span>Review pending applications</span> &rarr;
          </p>
        </Link>

        {/* Today's Bookings */}
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-400">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Bookings Today</p>
              <h3 className="text-3xl font-bold font-display text-white mt-1">{stats?.todayBookings}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <TrendingUp size={12} className="text-green-400" />
            <span className="text-green-400 font-medium">Active reservations</span> on platform
          </p>
        </div>

        {/* Total Bookings */}
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <CalendarCheck size={22} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Bookings</p>
              <h3 className="text-3xl font-bold font-display text-white mt-1">{stats?.totalBookings}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Lifetime completed & confirmed slots</p>
        </div>

        {/* Total Shops */}
        <Link to="/shops" className="stat-card hover:border-surface-border/80 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-400">
              <Store size={22} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Partner Salons</p>
              <h3 className="text-3xl font-bold font-display text-white mt-1">{stats?.totalShops}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 group-hover:text-white transition-colors">
            Manage all partner listings &rarr;
          </p>
        </Link>

        {/* Total Shop Owners */}
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
              <Award size={22} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Shop Owners</p>
              <h3 className="text-3xl font-bold font-display text-white mt-1">{stats?.totalOwners}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Registered vendors across districts</p>
        </div>

        {/* Total Customers */}
        <Link to="/users" className="stat-card hover:border-surface-border/80 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400">
              <Users size={22} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Registered Users</p>
              <h3 className="text-3xl font-bold font-display text-white mt-1">{stats?.totalUsers}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 group-hover:text-white transition-colors">
            Browse registered client list &rarr;
          </p>
        </Link>
      </div>

      {/* Chart & Trend Panel */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-lg text-white mb-4">Platform Booking Activity (This Week)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} />
              <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px" }}
                labelStyle={{ color: "#888", fontWeight: "bold" }}
                itemStyle={{ color: "#fff" }}
              />
              <Area type="monotone" dataKey="bookings" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
