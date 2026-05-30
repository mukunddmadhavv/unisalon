import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { Clock, Calendar, ShieldCheck, Mail, Lock, Eye, EyeOff, IndianRupee } from "lucide-react";
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
          email,
          password,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !hold) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div className="card p-8 max-w-md">
          <p className="text-red-400 font-semibold text-lg">Slot Reservation Expired</p>
          <p className="text-gray-500 text-sm mt-1">Your lock time has run out, or the salon slot was released early.</p>
          <Link to="/" className="btn-primary mt-6 inline-block">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center space-y-6 animate-slide-up">
          <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <ShieldCheck size={36} />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white">Booking Confirmed!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your appointment at <span className="font-semibold text-white">{hold.shop.name}</span> has been confirmed. A confirmation email has been dispatched to your inbox.
          </p>

          <div className="p-4 bg-surface rounded-xl border border-surface-border text-left space-y-2 text-xs text-gray-400">
            <div><span className="font-semibold text-white">Salon:</span> {hold.shop.name}</div>
            <div><span className="font-semibold text-white">Address:</span> {hold.shop.address}, {hold.shop.city}</div>
            <div><span className="font-semibold text-white">Date:</span> {hold.date}</div>
            <div><span className="font-semibold text-white">Time:</span> {hold.startTime} - {hold.endTime}</div>
            <div><span className="font-semibold text-white">Payment Mode:</span> Pay Cash at Shop</div>
          </div>

          <Link to="/profile" className="btn-primary w-full inline-block">
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="px-6 py-4 bg-surface-card border-b border-surface-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-lg">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </Link>
          <span className="text-xs text-gray-500 font-semibold uppercase">Booking Checkout</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {!session ? (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Sign In Required</h3>
                <p className="text-xs text-gray-500 mt-1">Authenticate to link your details to this reservation.</p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="label">Full name</label>
                    <input className="input text-sm py-2.5" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                )}

                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className="input pl-9 text-sm py-2.5" placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className="input pl-9 pr-10 text-sm py-2.5" placeholder="••••••••" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={authLoading} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
                  {authLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {authMode === "login" ? "Sign In & Continue" : "Create Account & Continue"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500">
                {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="text-brand-400 hover:text-brand-300 font-semibold">
                  {authMode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          ) : (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Reservation Details</h3>
                <p className="text-xs text-gray-500 mt-1">Provide optional notes for the stylist.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Additional Notes (Optional)</label>
                  <textarea
                    className="input min-h-[100px] text-sm resize-none"
                    placeholder="e.g. Beard trim details, fading height details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isPending}
                  className="btn-primary w-full py-3 font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  {confirmMutation.isPending ? "Confirming..." : "Confirm Booking (Pay Cash at Shop)"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          <div className="card p-6 text-center space-y-4 border-brand-500/20 bg-brand-500/5 relative overflow-hidden">
            <div>
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Locked Spot Timer</p>
              {timeLeft !== null && (
                <h2 className={`font-display font-extrabold text-4xl mt-2 tracking-tight ${timeLeft <= 20 ? "text-red-500 animate-pulse" : "text-white"}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </h2>
              )}
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                Confirm reservation before expiry or the spot releases for others.
              </p>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h4 className="font-semibold text-white text-sm pb-3 border-b border-surface-border">Summary</h4>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-gray-500 font-medium">Salon</p>
                <p className="text-white font-semibold mt-0.5">{hold.shop.name}</p>
              </div>

              <div>
                <p className="text-gray-500 font-medium">Schedule Time</p>
                <p className="text-white font-semibold mt-0.5 flex items-center gap-1">
                  <Calendar size={12} className="text-brand-500" /> {hold.date}
                </p>
                <p className="text-white font-semibold mt-0.5 flex items-center gap-1">
                  <Clock size={12} className="text-brand-500" /> {hold.startTime} - {hold.endTime}
                </p>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-sm">
                <span className="text-gray-400">Total Price</span>
                <div className="flex items-center gap-0.5 font-bold text-white">
                  <IndianRupee size={13} className="text-green-400" />
                  <span>Pay Cash</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
