import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth, SignIn } from "@clerk/react";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMins: number;
}

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
  services: Service[];
}

export default function BookingConfirmPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const [notes, setNotes] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-border-light border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !hold) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <div className="bg-white border border-border-light rounded-2xl p-10 max-w-sm text-center swiggy-shadow animate-fade-in">
          <p className="font-bold text-xl text-primary mb-2">Slot Hold Expired</p>
          <p className="text-text-secondary text-sm mb-6">Your slot lock time ran out or was released.</p>
          <Link to="/" className="btn-primary w-full justify-center">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Calculate detailed bill breakdown
  const itemTotal = (hold.services ?? []).reduce((sum, s) => sum + s.price, 0) / 100;
  const discount = itemTotal > 0 ? 200 : 0; // Mock discount like Swiggy screenshot
  const gst = itemTotal * 0.18; // 18% GST
  const convenienceFee = itemTotal > 0 ? 29 : 0;
  const totalToPay = Math.max(0, itemTotal - discount + gst + convenienceFee);

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <div className="bg-white border border-border-light rounded-2xl p-10 max-w-md w-full text-center swiggy-shadow animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-rating-green" />
          </div>
          <h2 className="font-display font-black text-2xl text-primary tracking-tight mb-2">Booking Confirmed!</h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-6">
            Your appointment at <strong>{hold.shop.name}</strong> is confirmed. A receipt has been dispatched to your email.
          </p>

          <div className="bg-surface border border-border-light rounded-xl p-4 text-left mb-6 space-y-2">
            {[
              ["Salon", hold.shop.name],
              ["Address", `${hold.shop.address}, ${hold.shop.city}`],
              ["Date", hold.date],
              ["Time", `${hold.startTime} – ${hold.endTime}`],
              ["Payment", "Pay Cash at Shop"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4 items-start text-xs">
                <span className="font-bold text-text-secondary min-w-[70px]">{k}</span>
                <span className="font-bold text-primary">{v}</span>
              </div>
            ))}
          </div>
          <Link to="/profile" className="btn-primary w-full justify-center">
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28 font-body-md text-text-primary">
      
      {/* ── TOP APP BAR ── */}
      <header className="bg-white sticky top-0 w-full z-50 flex justify-between items-center px-5 py-4 border-b border-border-light max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-surface-container rounded-full transition-colors" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined text-primary text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-lg text-primary">Secure Checkout</h1>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-primary text-lg">help_outline</span>
          <span className="text-xs font-bold text-text-secondary">Help</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pb-12 mt-4 px-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Auth Forms or Confirm Button */}
        <div className="md:col-span-7 space-y-4">
          {!isSignedIn ? (
            <div className="bg-white border border-border-light rounded-xl p-6 swiggy-shadow flex flex-col items-center">
              <h3 className="font-headline-md text-base text-primary mb-1 self-start">Sign In Required</h3>
              <p className="text-xs text-text-secondary font-medium mb-5 self-start">
                Authenticate to link your details to this reservation.
              </p>
              <SignIn routing="hash" />
            </div>
          ) : (
            <div className="bg-white border border-border-light rounded-xl p-6 swiggy-shadow space-y-4">
              <h3 className="font-headline-md text-base text-primary mb-1">Reservation Details</h3>
              <p className="text-xs text-text-secondary font-medium mb-4">Add optional requests or instructions for your stylist.</p>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 block">Appointment Notes</label>
                <textarea
                  className="us-input !rounded-xl !pl-4 !py-3 !text-xs border border-border-light hover:border-primary min-h-[96px] resize-y"
                  placeholder="e.g. Fading style height, specific clipper settings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="btn-primary w-full justify-center !py-3.5 !text-sm shadow-md"
              >
                {confirmMutation.isPending ? "Confirming..." : "Confirm Booking — Pay Cash at Shop ✨"}
              </button>
            </div>
          )}

          {/* Cancellation Policy */}
          <div className="bg-surface rounded-xl p-4 flex gap-3 border border-border-light">
            <span className="material-symbols-outlined text-text-secondary text-lg">info</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              Full refund if cancelled 2 hours before the slot. No refund or rescheduling permitted thereafter.
            </p>
          </div>
        </div>

        {/* Right Column: Timer & Bill Details */}
        <div className="md:col-span-5 space-y-4">
          
          {/* Lock Countdown */}
          <div className="bg-primary text-white rounded-xl p-5 text-center shadow-md">
            <p className="text-[10px] font-bold tracking-wider uppercase text-white/60 mb-1">Slot Locked For</p>
            {timeLeft !== null && (
              <div className={`font-display text-4xl font-extrabold tracking-tight ${timeLeft <= 20 ? "text-red-400" : "text-white"}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            )}
            <p className="text-[10px] text-white/50 mt-1 font-semibold">Confirm before expiry to prevent automatic release.</p>
          </div>

          {/* Detailed Bill Summary */}
          <div className="bg-white border border-border-light rounded-xl p-5 swiggy-shadow">
            <h4 className="font-headline-md text-sm text-primary mb-3">Booking Summary</h4>
            
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[9px] font-bold text-text-secondary uppercase">Salon</p>
                <p className="font-bold text-primary mt-0.5">{hold.shop.name}</p>
              </div>

              <div>
                <p className="text-[9px] font-bold text-text-secondary uppercase">Schedule</p>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-primary">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span>{hold.date}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 font-bold text-primary">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>{hold.startTime} – {hold.endTime}</span>
                </div>
              </div>
            </div>

            {/* Dash border divider */}
            <div className="dashed-divider my-4"></div>

            <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Bill Details</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center font-medium">
                <span className="text-text-secondary">Item Total</span>
                <span className="font-bold">₹{itemTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-offer-text font-bold">
                <span>Offer Discount (LUXE200)</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span className="text-text-secondary">GST &amp; Taxes (18%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span className="text-text-secondary">Convenience Fee</span>
                <span>₹{convenienceFee.toFixed(2)}</span>
              </div>
            </div>

            <hr className="my-4 border-border-light" />

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-tight">Total to Pay</span>
              <span className="font-headline-md text-base font-black text-primary">₹{totalToPay.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── STICKY BOTTOM PAYMENT BAR ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border-light px-5 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:px-16">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-headline-md text-lg font-black text-primary">
              ₹{totalToPay.toFixed(2)}
            </span>
            <span className="text-[10px] text-offer-text font-bold">View Detailed Bill</span>
          </div>
          <button
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending || !isSignedIn}
            className="bg-primary text-on-primary font-bold text-xs px-6 py-3 rounded-lg flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-40"
          >
            {confirmMutation.isPending ? "Confirming..." : "Proceed to Book"}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
