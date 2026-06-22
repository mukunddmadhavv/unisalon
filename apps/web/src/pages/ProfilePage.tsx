import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Star, AlertCircle, LogOut, Scissors, User } from "lucide-react";
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

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  PENDING:   { bg: "#fff8e1", color: "#b45309", border: "#fde68a" },
  CONFIRMED: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  CANCELLED: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  COMPLETED: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  NO_SHOW:   { bg: "#faf5ff", color: "#6b21a8", border: "#e9d5ff" },
};

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer-bookings"] }); toast.success("Appointment cancelled."); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to cancel."),
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { shopId: string; rating: number; comment?: string }) => api.postReview(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-bookings"] });
      setReviewShopId(null); setRating(5); setComment("");
      toast.success("Review submitted!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Already reviewed."),
  });

  const upcomingBookings = bookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status));
  const pastBookings = bookings.filter((b) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(b.status));
  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: "'Montserrat', Arial, sans-serif" }}>

      {/* Header */}
      <header style={{ background: "#1a1a1a", padding: "0 30px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Scissors size={20} color="#ffffff" />
          <span style={{ fontWeight: 900, fontSize: 18, color: "#ffffff" }}>UniSalon</span>
        </Link>
        <Link to="/explore" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
          Discover Salons
        </Link>
      </header>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 30px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>

        {/* Sidebar */}
        <aside>
          <div style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 24, textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#111111", color: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 24, margin: "0 auto 16px",
            }}>
              {user?.email?.[0].toUpperCase() ?? <User size={24} />}
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#02060c", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </p>
            <p style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", fontWeight: 600, marginBottom: 20 }}>Customer Account</p>

            <button
              onClick={() => { signOut(); navigate("/"); toast.success("Signed out."); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "10px 16px", borderRadius: 12,
                background: "#fef2f2", border: "1px solid #fecaca",
                color: "#991b1b", fontWeight: 700, fontSize: 13, cursor: "pointer",
                fontFamily: "'Montserrat', Arial, sans-serif",
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Bookings */}
        <section>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e4ebf3", marginBottom: 24 }}>
            {[["upcoming", `Upcoming (${upcomingBookings.length})`], ["past", `Past Visits (${pastBookings.length})`]].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "upcoming" | "past")}
                style={{
                  padding: "12px 20px", background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 14, fontWeight: 700,
                  color: activeTab === tab ? "#111111" : "rgba(2,6,12,0.4)",
                  borderBottom: activeTab === tab ? "2px solid #111111" : "2px solid transparent",
                  marginBottom: -2, transition: "all 0.15s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #e4ebf3", borderTopColor: "#111", borderRadius: "50%" }} />
            </div>
          ) : displayedBookings.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 24, padding: "64px 32px", textAlign: "center" }}>
              <AlertCircle size={36} style={{ color: "rgba(2,6,12,0.2)", display: "block", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, fontSize: 16, color: "#02060c" }}>No bookings yet</p>
              <p style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", marginTop: 6 }}>Your reservation history is empty.</p>
              <Link to="/" className="btn-primary" style={{ display: "inline-block", marginTop: 20 }}>
                Discover Salons
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {displayedBookings.map((booking) => {
                const s = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
                return (
                  <div key={booking.id} style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: 16, color: "#02060c", marginBottom: 6 }}>{booking.shop.name}</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(2,6,12,0.45)", fontWeight: 600 }}>
                          <MapPin size={11} /> {booking.shop.address}, {booking.shop.city}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.3px",
                        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                        borderRadius: 100, padding: "4px 12px",
                      }}>
                        {booking.status}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", padding: "14px 0", marginBottom: 14 }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "rgba(2,6,12,0.35)", marginBottom: 8 }}>Schedule</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#02060c" }}>
                          <Calendar size={13} color="rgba(2,6,12,0.4)" /> {booking.date}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#02060c" }}>
                          <Clock size={13} color="rgba(2,6,12,0.4)" /> {booking.startTime} – {booking.endTime}
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "rgba(2,6,12,0.35)", marginBottom: 8 }}>Services</p>
                        {booking.services.map((s, i) => (
                          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: "#02060c", marginBottom: 4 }}>• {s.serviceName}</p>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(2,6,12,0.55)" }}>
                        ₹{(booking.totalAmount / 100).toFixed(0)} — Pay Cash
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {activeTab === "upcoming" && ["PENDING", "CONFIRMED"].includes(booking.status) && (
                          <button
                            onClick={() => { if (confirm("Cancel this booking?")) cancelMutation.mutate(booking.id); }}
                            style={{
                              background: "#fef2f2", border: "1px solid #fecaca",
                              color: "#991b1b", borderRadius: 10, padding: "8px 16px",
                              fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        )}
                        {activeTab === "past" && booking.status === "COMPLETED" && (
                          <button
                            onClick={() => setReviewShopId(booking.shop.id)}
                            className="btn-primary"
                            style={{ padding: "8px 16px", fontSize: 12 }}
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

      {/* Review Modal */}
      {reviewShopId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setReviewShopId(null)} />
          <div style={{
            position: "relative", background: "#fff", border: "1px solid #e4ebf3",
            borderRadius: 28, padding: 32, width: "100%", maxWidth: 440,
            fontFamily: "'Montserrat', Arial, sans-serif",
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#02060c", marginBottom: 6 }}>Write a Review</h3>
            <p style={{ fontSize: 13, color: "rgba(2,6,12,0.5)", marginBottom: 24 }}>Share your experience with the salon.</p>

            <form onSubmit={(e) => { e.preventDefault(); if (!reviewShopId) return; reviewMutation.mutate({ shopId: reviewShopId, rating, comment: comment.trim() || undefined }); }}>
              <div style={{ marginBottom: 20 }}>
                <label className="label">Rating</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button key={num} type="button" onClick={() => setRating(num)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <Star size={28} style={{ color: num <= rating ? "#f59e0b" : "#e4ebf3", fill: num <= rating ? "#f59e0b" : "#e4ebf3", transition: "all 0.1s" }} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="label">Comments (Optional)</label>
                <textarea
                  className="input"
                  style={{ minHeight: 90, resize: "vertical", marginTop: 6 }}
                  placeholder="e.g. Great haircut! Very professional staff..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setReviewShopId(null)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={reviewMutation.isPending} className="btn-primary" style={{ flex: 1 }}>
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
