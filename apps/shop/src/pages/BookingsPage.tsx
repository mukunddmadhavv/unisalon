import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-800 border-gray-200",
};

const NEXT_STATUS: Record<string, { label: string; next: string }[]> = {
  PENDING: [
    { label: "Confirm Appointment", next: "CONFIRMED" },
    { label: "Cancel", next: "CANCELLED" },
  ],
  CONFIRMED: [
    { label: "Mark Completed", next: "COMPLETED" },
    { label: "Mark as No Show", next: "NO_SHOW" },
  ],
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
      toast.success("Appointment status updated!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update status"),
  });

  return (
    <div className="animate-fade-in select-none font-sans">
      <PageHeader
        title="Bookings & Appointments"
        subtitle="Manage customer reservations, track status, and coordinate stylus schedules."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Date Filter</label>
          <input
            type="date"
            className="input w-auto text-sm py-2 px-3 focus:border-primary"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status Filter</label>
          <select
            className="input w-auto text-sm py-2 px-3 bg-white focus:border-primary"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {(filterDate || filterStatus) && (
          <button
            onClick={() => { setFilterDate(""); setFilterStatus(""); }}
            className="mt-5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100/50 py-2 px-4 rounded-lg"
          >
            Clear Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bento-card p-12 text-center bg-white rounded-xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-3">calendar_today</span>
          <p className="text-on-surface-variant font-bold text-base">No bookings found</p>
          <p className="text-on-surface-variant opacity-60 text-sm">No reservations fit your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isExpanded = expanded === booking.id;
            return (
              <div key={booking.id} className="bento-card overflow-hidden bg-white rounded-xl border border-surface-container-high">
                {/* Main row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-surface-container-low transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : booking.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Date Block */}
                    <div className="text-center bg-surface-container-low rounded-lg p-2.5 min-w-[56px] border border-surface-container-high">
                      <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                        {format(new Date(booking.date), "MMM")}
                      </div>
                      <div className="text-lg font-extrabold text-on-surface leading-none mt-0.5">
                        {format(new Date(booking.date), "dd")}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-display font-bold text-sm text-on-surface">{booking.user.name}</p>
                      <div className="flex items-center gap-4 text-xs text-on-surface-variant font-medium">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                          {booking.startTime} – {booking.endTime}
                        </span>
                        {booking.staff && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-secondary">person</span>
                            {booking.staff.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="sm:text-right">
                      <span className="font-sans text-[10px] text-on-surface-variant block uppercase tracking-wider">Total price</span>
                      <p className="font-display font-extrabold text-base text-primary">₹{(booking.totalAmount / 100).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${statusColors[booking.status] ?? ""}`}>
                        {booking.status}
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-surface-container-high p-5 bg-surface-container-low/40 animate-fade-in space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Client Info</h4>
                        <div className="bg-white border border-surface-container-high rounded-xl p-4 space-y-1">
                          <p className="text-sm font-bold text-on-surface">{booking.user.name}</p>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">mail</span>
                            {booking.user.email}
                          </p>
                          {booking.user.phone && (
                            <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                              <span className="material-symbols-outlined text-xs">call</span>
                              {booking.user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Booked Services</h4>
                        <div className="bg-white border border-surface-container-high rounded-xl p-4 divide-y divide-surface-container-high">
                          {booking.services.map((s, i) => (
                            <div key={i} className="flex justify-between items-center py-2 first:pt-0 last:pb-0 text-sm">
                              <div>
                                <span className="font-semibold text-on-surface">{s.serviceName}</span>
                                <span className="text-xs text-on-surface-variant ml-2">({s.durationMins}m)</span>
                              </div>
                              <span className="font-bold text-primary">₹{(s.pricePaise / 100).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="bg-white border border-surface-container-high p-4 rounded-xl">
                        <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Appointment Notes</h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{booking.notes}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {NEXT_STATUS[booking.status] && (
                      <div className="flex flex-wrap gap-3 pt-3 border-t border-surface-container-high">
                        {NEXT_STATUS[booking.status].map(({ label, next }) => {
                          const isDestructive = next === "CANCELLED" || next === "NO_SHOW";
                          return (
                            <button
                              key={next}
                              onClick={() => statusMutation.mutate({ id: booking.id, status: next })}
                              disabled={statusMutation.isPending}
                              className={isDestructive
                                ? "btn-outline !py-2 !px-4 text-xs font-bold text-error border-error/30 hover:border-error hover:bg-error/5 disabled:opacity-50"
                                : "btn-primary !py-2 !px-4 text-xs font-bold bg-primary hover:opacity-90 disabled:opacity-50"
                              }
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
