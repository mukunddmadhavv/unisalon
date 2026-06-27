import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
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
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Stateful Closed/Unavailable slots stored in localStorage: "YYYY-MM-DD" -> Array of hours
  const [closedSlots, setClosedSlots] = useState<Record<string, number[]>>(() => {
    const saved = localStorage.getItem("shop-closed-slots");
    return saved ? JSON.parse(saved) : {};
  });

  const toggleSlotAvailability = (dateStr: string, hour: number) => {
    const currentClosed = closedSlots[dateStr] ?? [];
    let updatedClosed: number[];
    if (currentClosed.includes(hour)) {
      updatedClosed = currentClosed.filter((h) => h !== hour);
      toast.success(`Slot at ${formatHour(hour).hourStr} ${formatHour(hour).period} is now open for booking.`);
    } else {
      updatedClosed = [...currentClosed, hour];
      toast.success(`Slot at ${formatHour(hour).hourStr} ${formatHour(hour).period} is closed.`);
    }

    const nextState = { ...closedSlots, [dateStr]: updatedClosed };
    setClosedSlots(nextState);
    localStorage.setItem("shop-closed-slots", JSON.stringify(nextState));
  };

  // Generate days in selected month for date scroll carousel
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Query shop detail for operating hours
  const { data: shop } = useQuery({
    queryKey: ["owner-shop"],
    queryFn: async () => {
      const res = await api.getShop() as any;
      return res.data ?? res;
    },
  });

  // Fetch bookings for the selected date
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["owner-bookings", selectedDate],
    queryFn: async () => {
      const res = await api.getOwnerBookings({ date: selectedDate }) as { data?: Booking[] } | Booking[];
      return (Array.isArray(res) ? res : (res as { data?: Booking[] }).data) ?? [];
    },
    enabled: !!shop?.id,
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

  // Hours calculation based on operating hours
  const startHour = shop?.openTime ? parseInt(shop.openTime.split(":")[0]) : 9;
  const endHour = shop?.closeTime ? parseInt(shop.closeTime.split(":")[0]) : 21;

  const hoursList: number[] = [];
  for (let h = startHour; h < endHour; h++) {
    hoursList.push(h);
  }

  const formatHour = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return {
      hourStr: String(displayHour).padStart(2, "0"),
      period,
    };
  };

  const getBookingForHour = (hour: number) => {
    return bookings.find((b) => {
      const bHour = parseInt(b.startTime.split(":")[0]);
      return bHour === hour;
    });
  };

  // Scroll to active selected date card on load/change
  useEffect(() => {
    const activeEl = document.getElementById(`date-card-${selectedDate}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedDate]);

  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const estRevenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalAmount, 0) / 100;
  const fillPercentage = hoursList.length > 0
    ? Math.round((bookings.length / hoursList.length) * 100)
    : 0;

  const nextUp = bookings
    .filter((b) => b.status === "CONFIRMED")
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        subtitle="Manage slots and coordinate customer appointments in a daily timeline view."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Date Selector & Timeline */}
        <div className="flex-1 space-y-6">
          {/* Date Selection Section */}
          <section className="bg-white border border-border-light rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-base font-extrabold text-text-primary">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  className="p-1 hover:bg-surface-container rounded-full text-text-secondary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="p-1 hover:bg-surface-container rounded-full text-text-secondary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Horizontal Date picker scroll */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
              {daysInMonth.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isActive = dateStr === selectedDate;
                return (
                  <div
                    key={dateStr}
                    id={`date-card-${dateStr}`}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setExpandedBookingId(null);
                    }}
                    className={`flex-shrink-0 w-14 h-[76px] flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-md scale-102"
                        : "border border-border-light bg-white hover:border-primary text-text-primary"
                    }`}
                  >
                    <span className={`font-sans text-[10px] font-extrabold uppercase ${isActive ? "text-white/80" : "text-text-secondary"}`}>
                      {format(day, "eee")}
                    </span>
                    <span className="font-display text-lg font-black mt-0.5">
                      {format(day, "d")}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Slot timeline dashboard */}
          <section className="bg-white border border-border-light rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-light">
              <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-text-secondary">Timeline</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 font-sans text-xs font-bold text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-rating-green"></span> Booked
                </span>
                <span className="flex items-center gap-1.5 font-sans text-xs font-bold text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-outline-variant"></span> Closed
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <span className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {hoursList.map((hour) => {
                  const booking = getBookingForHour(hour);
                  const { hourStr, period } = formatHour(hour);
                  const isClosed = (closedSlots[selectedDate] ?? []).includes(hour);

                  if (booking) {
                    const isExpanded = expandedBookingId === booking.id;
                    return (
                      <div key={booking.id} className="border border-border-light rounded-xl overflow-hidden bg-background">
                        {/* Collapsed main row */}
                        <div
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                          className="p-4 flex gap-4 items-center cursor-pointer hover:bg-white transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-border-light pr-4">
                            <span className="font-display text-lg font-black text-text-primary">{hourStr}</span>
                            <span className="font-sans text-[10px] font-bold text-text-secondary uppercase">{period}</span>
                          </div>
                          <div className="flex-1 flex justify-between items-center min-w-0">
                            <div className="min-w-0 pr-2">
                              <span className="font-sans text-sm font-bold text-text-primary block truncate">{booking.user.name}</span>
                              <span className="font-sans text-xs text-text-secondary block truncate mt-0.5">
                                {booking.services.map((s) => s.serviceName).join(", ")}
                              </span>
                            </div>
                            <span className="bg-offer-bg text-offer-text px-3 py-1 rounded-full font-sans text-[10px] font-bold uppercase border border-rating-green/20 shrink-0">
                              Booked
                            </span>
                          </div>
                        </div>

                        {/* Expanded booking details */}
                        {isExpanded && (
                          <div className="border-t border-border-light p-4 bg-white space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <h4 className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Client Details</h4>
                                <div className="bg-background border border-border-light rounded-lg p-3 space-y-1">
                                  <p className="text-xs font-bold text-text-primary">{booking.user.name}</p>
                                  <p className="text-xs text-text-secondary flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px]">mail</span>
                                    {booking.user.email}
                                  </p>
                                  {booking.user.phone && (
                                    <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                                      <span className="material-symbols-outlined text-[14px]">call</span>
                                      {booking.user.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <h4 className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Booked Services</h4>
                                <div className="bg-background border border-border-light rounded-lg p-3 divide-y divide-border-light">
                                  {booking.services.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0 text-xs">
                                      <div>
                                        <span className="font-bold text-text-primary">{s.serviceName}</span>
                                        <span className="text-[10px] text-text-secondary ml-2">({s.durationMins}m)</span>
                                      </div>
                                      <span className="font-display font-extrabold text-primary">₹{(s.pricePaise / 100).toFixed(0)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="bg-background border border-border-light p-3 rounded-lg">
                                <h4 className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mb-1">Notes</h4>
                                <p className="text-xs text-text-secondary leading-relaxed">{booking.notes}</p>
                              </div>
                            )}

                            {/* Status Mutation controls */}
                            {NEXT_STATUS[booking.status] && (
                              <div className="flex flex-wrap gap-2 pt-3 border-t border-border-light">
                                {NEXT_STATUS[booking.status].map(({ label, next }) => {
                                  const isCancel = next === "CANCELLED" || next === "NO_SHOW";
                                  return (
                                    <button
                                      key={next}
                                      onClick={() => statusMutation.mutate({ id: booking.id, status: next })}
                                      disabled={statusMutation.isPending}
                                      className={
                                        isCancel
                                          ? "py-2 px-4 border border-border-light rounded-lg font-sans text-xs font-bold text-error hover:bg-red-50 disabled:opacity-50 transition-colors"
                                          : "py-2 px-4 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
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
                  }

                  // Empty slot (either available or toggled closed)
                  return (
                    <div
                      key={hour}
                      className={`border rounded-xl p-4 flex gap-4 transition-all ${
                        isClosed
                          ? "bg-surface border-border-light border-dashed opacity-75"
                          : "bg-white border-border-light hover:bg-background"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-border-light pr-4">
                        <span className={`font-display text-lg font-black ${isClosed ? "text-text-secondary" : "text-text-primary"}`}>
                          {hourStr}
                        </span>
                        <span className="font-sans text-[10px] font-bold text-text-secondary uppercase">{period}</span>
                      </div>
                      <div className="flex-1 flex justify-between items-center min-w-0">
                        <div className="min-w-0">
                          <span className={`font-sans text-sm font-bold block ${isClosed ? "text-text-secondary" : "text-text-primary"}`}>
                            {isClosed ? "Unavailable" : "Available"}
                          </span>
                          <span className="font-sans text-xs text-text-secondary block mt-0.5 italic">
                            {isClosed ? "Closed for bookings" : "Open for booking"}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleSlotAvailability(selectedDate, hour)}
                          className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-200 ${
                            isClosed ? "bg-outline-variant" : "bg-primary"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                              isClosed ? "translate-x-0" : "translate-x-6"
                            }`}
                          ></div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Daily Summary Stats Card */}
          <div className="bg-white border border-border-light rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-headline-md text-sm font-extrabold uppercase tracking-wider text-text-secondary">Daily Summary</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface-container-low p-3 rounded-lg border border-border-light text-center">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Confirmed</span>
                <div className="text-2xl font-black text-primary mt-1">{confirmedCount}</div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg border border-border-light text-center">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Pending</span>
                <div className="text-2xl font-black text-secondary mt-1">{pendingCount}</div>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-text-secondary">Est. Daily Revenue</span>
                <span className="text-primary font-extrabold">₹{estRevenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5">
                <div className="bg-rating-green h-1.5 rounded-full transition-all" style={{ width: `${fillPercentage}%` }}></div>
              </div>
              <p className="text-[10px] font-bold text-text-secondary">{fillPercentage}% of slots reserved for today</p>
            </div>
          </div>

          {/* Next Up Card */}
          {nextUp ? (
            <div className="bg-primary text-on-primary rounded-xl p-5 shadow-lg relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Next Up Today ({nextUp.startTime})</span>
                  <h4 className="font-headline-lg text-lg font-black text-white mt-1">{nextUp.user.name}</h4>
                  <p className="text-xs text-white/80 mt-1 truncate">{nextUp.services.map((s) => s.serviceName).join(", ")}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${nextUp.user.phone}`}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-colors text-center flex-1"
                  >
                    Call Client
                  </a>
                  <button
                    onClick={() => statusMutation.mutate({ id: nextUp.id, status: "COMPLETED" })}
                    className="bg-white text-primary px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-white/95 transition-all text-center flex-1"
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-border-light p-5 rounded-xl text-center shadow-sm">
              <span className="material-symbols-outlined text-text-secondary text-2xl">done_all</span>
              <p className="text-xs text-text-secondary font-bold mt-1">No upcoming bookings today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

