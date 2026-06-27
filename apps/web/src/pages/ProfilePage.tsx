import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useUser, useClerk } from "@clerk/react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Star, AlertCircle, LogOut } from "lucide-react";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  shop: { id: string; name: string; address: string; city: string; };
  services: Array<{ serviceName: string; pricePaise: number; }>;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  NO_SHOW:   "bg-gray-100 text-gray-800 border-gray-200",
};

export default function ProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [reviewShopId, setReviewShopId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["customer-bookings"],
    queryFn: () => api.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      toast.success("Appointment cancelled.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to cancel."),
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { shopId: string; rating: number; comment?: string }) => api.postReview(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      setReviewShopId(null);
      setRating(5);
      setComment("");
      toast.success("Review submitted!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Already reviewed."),
  });

  const upcomingBookings = bookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status));
  const pastBookings = bookings.filter((b) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(b.status));
  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <div className="min-h-screen bg-background pb-24 font-body-md text-text-primary">
      
      {/* ── TOP NAV BAR ── */}
      <header className="bg-white sticky top-0 w-full px-5 py-4 z-50 flex justify-between items-center border-b border-border-light max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined text-primary text-[24px]">arrow_back</span>
          </Link>
          <h1 className="font-display font-black text-lg tracking-tight text-primary">My Account</h1>
        </div>
        <Link to="/explore" className="text-xs font-bold text-text-secondary hover:text-primary transition-colors">
          Discover Partner Salons
        </Link>
      </header>

      {/* ── PAGE LAYOUT ── */}
      <div className="max-w-4xl mx-auto mt-6 px-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Profile Info Card (Left Sidebar) */}
        <aside className="md:col-span-4">
          <div className="bg-white border border-border-light rounded-xl p-5 swiggy-shadow text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-sm">
              {user?.primaryEmailAddress?.emailAddress?.[0].toUpperCase() ?? "U"}
            </div>
            <p className="font-bold text-sm text-primary truncate px-2 mb-0.5">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-5">Customer Account</p>

            <button
              onClick={() => { signOut(); navigate("/"); toast.success("Signed out."); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Bookings List Panel (Right Column) */}
        <section className="md:col-span-8 space-y-5">
          
          {/* Tab Options */}
          <div className="flex border-b border-border-light">
            {[
              ["upcoming", `Upcoming (${upcomingBookings.length})`],
              ["past", `Past Visits (${pastBookings.length})`],
            ].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "upcoming" | "past")}
                className={`pb-2.5 px-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === tab
                    ? "text-primary border-primary"
                    : "text-text-secondary border-transparent hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-border-light border-t-primary rounded-full animate-spin" />
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="bg-white border border-border-light rounded-xl p-12 text-center swiggy-shadow">
              <AlertCircle size={36} className="text-text-secondary/30 mx-auto mb-3" />
              <p className="font-bold text-sm text-primary">No appointments found</p>
              <p className="text-xs text-text-secondary mt-1">Your appointment listing is currently empty.</p>
              <Link to="/" className="btn-primary inline-flex mt-5 !text-xs !py-2.5">
                Discover Salons
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {displayedBookings.map((booking) => {
                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-border-light rounded-xl p-5 swiggy-shadow space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-headline-md text-sm font-bold text-primary mb-1">{booking.shop.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-text-secondary font-medium">
                          <MapPin size={12} className="text-text-secondary/70 shrink-0" />
                          <span className="truncate">{booking.shop.address}, {booking.shop.city}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[booking.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-b border-border-light py-4 text-xs font-semibold">
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase mb-2">Schedule</p>
                        <div className="flex items-center gap-1.5 font-bold text-primary">
                          <Calendar size={13} className="text-text-secondary/80" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 font-bold text-primary">
                          <Clock size={13} className="text-text-secondary/80" />
                          <span>{booking.startTime} – {booking.endTime}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-text-secondary uppercase mb-2">Services</p>
                        {booking.services.map((s, i) => (
                          <p key={i} className="font-bold text-primary truncate">&bull; {s.serviceName}</p>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary/85">
                        ₹{(booking.totalAmount / 100).toFixed(0)} &bull; Cash payment
                      </span>
                      <div className="flex gap-2">
                        {activeTab === "upcoming" && ["PENDING", "CONFIRMED"].includes(booking.status) && (
                          <button
                            onClick={() => { if (confirm("Cancel this booking?")) cancelMutation.mutate(booking.id); }}
                            className="px-3.5 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {activeTab === "past" && booking.status === "COMPLETED" && (
                          <button
                            onClick={() => setReviewShopId(booking.shop.id)}
                            className="bg-primary text-on-primary text-xs font-bold px-3.5 py-1.5 rounded-lg hover:opacity-90 active:scale-95 transition-all"
                          >
                            Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Review Modal popup */}
      {reviewShopId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setReviewShopId(null)} />
          <div className="relative bg-white border border-border-light rounded-xl p-6 w-full max-w-sm swiggy-shadow">
            <h3 className="font-headline-md text-base text-primary mb-1">Write a Review</h3>
            <p className="text-xs text-text-secondary font-medium mb-4">Share your feedback about the service received.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reviewShopId) return;
                reviewMutation.mutate({ shopId: reviewShopId, rating, comment: comment.trim() || undefined });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block">Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className="p-0.5 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={24}
                        className={num <= rating ? "text-secondary fill-secondary" : "text-border-light fill-border-light"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block">Comments (Optional)</label>
                <textarea
                  className="us-input !rounded-xl !pl-4 !py-3 !text-xs border border-border-light hover:border-primary min-h-[80px] resize-y"
                  placeholder="Describe your styling experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2 text-xs">
                <button type="button" onClick={() => setReviewShopId(null)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={reviewMutation.isPending} className="btn-primary flex-1 justify-center">
                  {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
