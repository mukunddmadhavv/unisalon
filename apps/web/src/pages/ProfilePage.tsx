import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
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
  shop: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  services: Array<{
    serviceName: string;
    pricePaise: number;
  }>;
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
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
      toast.success("Appointment cancelled successfully.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to cancel booking."),
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { shopId: string; rating: number; comment?: string }) => api.postReview(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      setReviewShopId(null);
      setRating(5);
      setComment("");
      toast.success("Thank you for your feedback! Review submitted.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "You have already reviewed this shop."),
  });

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewShopId) return;
    reviewMutation.mutate({ shopId: reviewShopId, rating, comment: comment.trim() || undefined });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      CONFIRMED: "bg-green-500/10 text-green-400 border-green-500/20",
      CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
      COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      NO_SHOW: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badges[status] ?? badges.PENDING}`}>
        {status}
      </span>
    );
  };

  const upcomingBookings = bookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status));
  const pastBookings = bookings.filter((b) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(b.status));

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="px-6 py-4 bg-surface-card border-b border-surface-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-lg">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </Link>
          <Link to="/" className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            Discover Salons
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="card p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold mx-auto text-lg">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-white truncate text-sm">{user?.email}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Customer Account</p>
            </div>

            <button
              onClick={() => { signOut(); navigate("/"); toast.success("Signed out successfully."); }}
              className="btn-outline border-red-500/15 text-xs text-red-400 hover:bg-red-500/10 w-full flex items-center justify-center gap-1.5 py-1.5"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </aside>

        <section className="lg:col-span-3 space-y-6">
          <div className="flex border-b border-surface-border gap-6">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-3 text-sm font-semibold transition-all ${
                activeTab === "upcoming" ? "text-brand-400 border-b-2 border-brand-500" : "text-gray-500 hover:text-white"
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`pb-3 text-sm font-semibold transition-all ${
                activeTab === "past" ? "text-brand-400 border-b-2 border-brand-500" : "text-gray-500 hover:text-white"
              }`}
            >
              Past Visits ({pastBookings.length})
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : (activeTab === "upcoming" ? upcomingBookings : pastBookings).length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              <AlertCircle size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="text-white font-medium text-sm">No bookings listed</p>
              <p className="text-xs mt-1">Your reservation history is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(activeTab === "upcoming" ? upcomingBookings : pastBookings).map((booking) => (
                <div key={booking.id} className="card p-5 space-y-4 animate-slide-up">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white text-md">{booking.shop.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin size={11} /> {booking.shop.address}, {booking.shop.city}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-surface-border text-xs">
                    <div className="space-y-1 text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-500" />
                        <span>Date: <span className="text-white font-medium">{booking.date}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={13} className="text-gray-500" />
                        <span>Time: <span className="text-white font-medium">{booking.startTime} - {booking.endTime}</span></span>
                      </div>
                    </div>

                    <div className="space-y-1 text-gray-400">
                      <p className="font-semibold text-[10px] text-gray-500 uppercase">SERVICES</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {booking.services.map((s, idx) => (
                          <li key={idx}>
                            {s.serviceName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase">
                      Total: ₹{(booking.totalAmount / 100).toFixed(0)} (Cash)
                    </span>

                    {activeTab === "upcoming" && ["PENDING", "CONFIRMED"].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="btn-outline border-red-500/10 hover:border-red-500/40 text-red-400 text-xs py-1.5 px-3 rounded-lg"
                      >
                        Cancel Booking
                      </button>
                    )}

                    {activeTab === "past" && booking.status === "COMPLETED" && (
                      <button
                        onClick={() => setReviewShopId(booking.shop.id)}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        Write Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {reviewShopId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReviewShopId(null)} />
          <div className="relative card p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-semibold text-lg text-white mb-2">Write Shop Review</h3>
            <p className="text-xs text-gray-500 mb-4">Share your feedback about the salon styling and stylist staff.</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="label text-xs">Rating Score (1-5 Stars)</label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className="text-yellow-400 transition-transform active:scale-90"
                    >
                      <Star size={24} className={num <= rating ? "fill-current" : ""} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label text-xs">Comments (Optional)</label>
                <textarea
                  className="input min-h-[90px] text-xs resize-none"
                  placeholder="e.g. Great style haircut! The staff was very professional and operations were extremely clean."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewShopId(null)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="btn-primary flex-1"
                >
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
