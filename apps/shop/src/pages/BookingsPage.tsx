import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarCheck, Clock, ChevronDown } from "lucide-react";
import { PageHeader } from "../components/DashboardLayout";
import { api } from "../lib/api";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  notes?: string;
  user: { name: string; email: string; phone?: string };
  staff: { name: string } | null;
  services: Array<{ serviceName: string; pricePaise: number; durationMins: number }>;
}

const STATUS_OPTIONS = ["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CONFIRMED: "bg-green-500/20 text-green-400 border-green-500/30",
  COMPLETED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  NO_SHOW: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const NEXT_STATUS: Record<string, { label: string; next: string }[]> = {
  PENDING: [{ label: "Confirm", next: "CONFIRMED" }, { label: "Cancel", next: "CANCELLED" }],
  CONFIRMED: [{ label: "Mark Complete", next: "COMPLETED" }, { label: "No Show", next: "NO_SHOW" }],
};

export default function BookingsPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["owner-bookings", filterDate, filterStatus],
    queryFn: async () => {
      const res = await api.getOwnerBookings({
        ...(filterDate && { date: filterDate }),
        ...(filterStatus && { status: filterStatus }),
      }) as { data?: Booking[] } | Booking[];
      return (Array.isArray(res) ? res : (res as { data?: Booking[] }).data) ?? [];
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateBookingStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-bookings"] });
      toast.success("Booking status updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Manage all your customer appointments"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          className="input w-auto text-sm"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <select
          className="input w-auto text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(filterDate || filterStatus) && (
          <button onClick={() => { setFilterDate(""); setFilterStatus(""); }}
            className="btn-ghost text-sm px-3 py-2 text-red-400 hover:text-red-300">
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarCheck size={36} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No bookings found</p>
          <p className="text-gray-600 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="card overflow-hidden">
              {/* Main row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-card/50 transition-colors"
                onClick={() => setExpanded(expanded === booking.id ? null : booking.id)}
              >
                <div className="text-center min-w-[48px]">
                  <div className="text-xs text-gray-500 font-medium">
                    {format(new Date(booking.date), "MMM")}
                  </div>
                  <div className="text-xl font-bold text-white leading-none">
                    {format(new Date(booking.date), "dd")}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-400 w-32 flex-shrink-0">
                  <Clock size={13} />
                  <span>{booking.startTime} – {booking.endTime}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{booking.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {booking.services.map((s) => s.serviceName).join(", ")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-white">₹{(booking.totalAmount / 100).toFixed(0)}</p>
                  {booking.staff && <p className="text-xs text-gray-500">{booking.staff.name}</p>}
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[booking.status] ?? ""}`}>
                  {booking.status}
                </span>

                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform ${expanded === booking.id ? "rotate-180" : ""}`}
                />
              </div>

              {/* Expanded detail */}
              {expanded === booking.id && (
                <div className="border-t border-surface-border p-4 bg-surface animate-fade-in">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</h4>
                      <p className="text-sm text-white">{booking.user.name}</p>
                      <p className="text-xs text-gray-400">{booking.user.email}</p>
                      {booking.user.phone && <p className="text-xs text-gray-400">{booking.user.phone}</p>}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</h4>
                      {booking.services.map((s, i) => (
                        <div key={i} className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{s.serviceName} <span className="text-gray-500">({s.durationMins}m)</span></span>
                          <span className="text-white">₹{(s.pricePaise / 100).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</h4>
                      <p className="text-sm text-gray-400">{booking.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {NEXT_STATUS[booking.status] && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-surface-border">
                      {NEXT_STATUS[booking.status].map(({ label, next }) => (
                        <button
                          key={next}
                          onClick={() => statusMutation.mutate({ id: booking.id, status: next })}
                          disabled={statusMutation.isPending}
                          className={next === "CANCELLED" || next === "NO_SHOW" ? "btn-outline text-sm py-2 px-4" : "btn-primary text-sm py-2 px-4"}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
