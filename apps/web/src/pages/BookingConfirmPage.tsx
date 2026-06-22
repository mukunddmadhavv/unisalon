import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { Clock, Calendar, ShieldCheck, Mail, Lock, Eye, EyeOff, IndianRupee, Scissors } from "lucide-react";
import toast from "react-hot-toast";

interface SlotHoldDetail {
  id: string;
  shopId: string;
  date: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
  serviceIds: string[];
  shop: {
    name: string;
    address: string;
    city: string;
  };
}

export default function BookingConfirmPage() {
  const navigate = useNavigate();
  const { session, setSession } = useAuthStore();

  const [notes, setNotes] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const holdId = localStorage.getItem("unisalon-active-hold-id");

  useEffect(() => {
    if (!holdId) {
      toast.error("No active session hold found. Choose a slot first.");
      navigate("/");
    }
  }, [holdId]);

  const { data: hold, isLoading: isHoldLoading, error } = useQuery<SlotHoldDetail>({
    queryKey: ["active-hold", holdId],
    queryFn: () => api.getSlotHold(holdId!),
    enabled: !!holdId,
    retry: false,
  });

  useEffect(() => {
    if (!hold?.expiresAt || confirmed) return;
    const expiryTime = new Date(hold.expiresAt).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        api.releaseSlotHold(holdId!).catch(() => {});
        localStorage.removeItem("unisalon-active-hold-id");
        toast.error("Slot hold expired! Please select a new slot.");
        navigate("/");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hold?.expiresAt, confirmed]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name, role: "CUSTOMER" } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
        toast.success("Signed in successfully!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const confirmMutation = useMutation({
    mutationFn: () => api.createBooking({ holdId: holdId!, notes: notes || undefined }),
    onSuccess: () => {
      setConfirmed(true);
      localStorage.removeItem("unisalon-active-hold-id");
      toast.success("Booking confirmed! See you at the salon.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to confirm booking.");
    },
  });

  if (isHoldLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e4ebf3", borderTopColor: "#111", borderRadius: "50%" }} />
      </div>
    );
  }

  if (error || !hold) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 48, maxWidth: 400, textAlign: "center" }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: "#02060c", marginBottom: 8 }}>Slot Hold Expired</p>
          <p style={{ fontSize: 14, color: "rgba(2,6,12,0.5)", marginBottom: 24 }}>Your lock time ran out or was released.</p>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Montserrat', Arial, sans-serif" }}>
        <div style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 28, padding: "48px 40px", maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#f0fdf4", border: "2px solid #86efac",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
          }}>
            <ShieldCheck size={36} style={{ color: "#16a34a" }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#02060c", letterSpacing: "-0.5px", marginBottom: 12 }}>Booking Confirmed!</h2>
          <p style={{ fontSize: 14, color: "rgba(2,6,12,0.55)", lineHeight: 1.6, marginBottom: 28 }}>
            Your appointment at <strong>{hold.shop.name}</strong> has been confirmed. A confirmation email has been dispatched to your inbox.
          </p>

          <div style={{ background: "#f5f7fa", border: "1px solid #e4ebf3", borderRadius: 16, padding: "16px 20px", textAlign: "left", marginBottom: 24 }}>
            {[
              ["Salon", hold.shop.name],
              ["Address", `${hold.shop.address}, ${hold.shop.city}`],
              ["Date", hold.date],
              ["Time", `${hold.startTime} – ${hold.endTime}`],
              ["Payment", "Pay Cash at Shop"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(2,6,12,0.4)", minWidth: 72 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#02060c" }}>{v}</span>
              </div>
            ))}
          </div>
          <Link to="/profile" className="btn-primary" style={{ display: "block", width: "100%", textAlign: "center" }}>
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: "'Montserrat', Arial, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#1a1a1a", padding: "0 30px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Scissors size={20} color="#ffffff" />
          <span style={{ fontWeight: 900, fontSize: 18, color: "#ffffff" }}>UniSalon</span>
        </Link>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
          Booking Checkout
        </span>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 30px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        {/* Left: Auth or Notes */}
        <div>
          {!session ? (
            <div style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#02060c", marginBottom: 6 }}>Sign In Required</h3>
              <p style={{ fontSize: 13, color: "rgba(2,6,12,0.5)", fontWeight: 500, marginBottom: 24 }}>
                Authenticate to link your details to this reservation.
              </p>

              <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {authMode === "signup" && (
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                )}
                <div>
                  <label className="label">Email Address</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(2,6,12,0.3)" }} />
                    <input className="input" style={{ paddingLeft: 40 }} placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(2,6,12,0.3)" }} />
                    <input className="input" style={{ paddingLeft: 40, paddingRight: 44 }} placeholder="••••••••" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(2,6,12,0.3)" }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={authLoading} className="btn-primary" style={{ width: "100%", padding: "14px 28px" }}>
                  {authMode === "login" ? "Sign In & Continue" : "Create Account & Continue"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 12, color: "rgba(2,6,12,0.45)", marginTop: 16 }}>
                {authMode === "login" ? "No account? " : "Have one? "}
                <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", fontWeight: 800, fontSize: 12, color: "#111", cursor: "pointer", textDecoration: "underline" }}>
                  {authMode === "login" ? "Register" : "Sign in"}
                </button>
              </p>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#02060c", marginBottom: 6 }}>Reservation Details</h3>
              <p style={{ fontSize: 13, color: "rgba(2,6,12,0.5)", fontWeight: 500, marginBottom: 24 }}>Optional notes for your stylist.</p>

              <label className="label">Additional Notes (Optional)</label>
              <textarea
                className="input"
                style={{ minHeight: 100, resize: "vertical", marginBottom: 20 }}
                placeholder="e.g. Beard trim details, fading height..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="btn-primary"
                style={{ width: "100%", padding: "14px 28px", fontSize: 15 }}
              >
                {confirmMutation.isPending ? "Confirming..." : "Confirm Booking — Pay Cash at Shop"}
              </button>
            </div>
          )}
        </div>

        {/* Right: Timer + Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Countdown */}
          <div style={{
            background: "#111111", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24, padding: 24, textAlign: "center",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>
              Slot Locked For
            </p>
            {timeLeft !== null && (
              <div style={{
                fontSize: 48, fontWeight: 900, letterSpacing: "-2px", fontFamily: "'Montserrat', Arial, sans-serif",
                color: timeLeft <= 20 ? "#ef4444" : "#ffffff",
              }}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            )}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8, fontWeight: 500 }}>
              Confirm before expiry or the slot releases.
            </p>
          </div>

          {/* Summary card */}
          <div style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: "#02060c", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
              Booking Summary
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Salon", hold.shop.name],
                ["Address", `${hold.shop.address}, ${hold.shop.city}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.4)", marginBottom: 2 }}>{k}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#02060c" }}>{v}</p>
                </div>
              ))}

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.4)", marginBottom: 6 }}>Schedule</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Calendar size={13} style={{ color: "#111111" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#02060c" }}>{hold.date}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={13} style={{ color: "#111111" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#02060c" }}>{hold.startTime} – {hold.endTime}</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", fontWeight: 600 }}>Payment</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <IndianRupee size={13} style={{ color: "#16a34a" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#02060c" }}>Pay Cash</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
