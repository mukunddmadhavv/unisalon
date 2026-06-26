import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { Mail, Lock, Eye, EyeOff, Scissors } from "lucide-react";
import toast from "react-hot-toast";

type Mode = "login" | "signup";

const FEATURES = [
  { icon: "📅", title: "Instant Confirmations", desc: "Lock your slot in seconds — no waiting queues" },
  { icon: "💵", title: "Pay At Shop", desc: "No online payment. Pay cash at the counter." },
  { icon: "⭐", title: "Verified Stylists", desc: "Check community ratings before you book." },
];

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, phone: phone || undefined, role: "CUSTOMER" } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
        toast.success("Logged in successfully!");
        navigate("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background font-body-md text-text-primary">
      
      {/* Left panel — Dark Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-primary text-white flex-col justify-between p-12 border-r border-border-light relative overflow-hidden">
        
        {/* Soft background glow / shapes */}
        <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-secondary-container/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-offer-text/5 rounded-full blur-[80px]" />

        {/* Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <Scissors size={22} className="text-secondary-container" />
          <span className="font-display font-black text-xl tracking-tight text-white">UniSalon</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <h1 className="font-display font-extrabold text-white text-4xl leading-tight tracking-tight">
            Hair done.<br />
            <span className="text-white/40">Price right.</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            India's premier salon discovery and booking platform. Reserve time slots on-the-fly, select your stylist, and skip the waiting queue.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-3.5 pt-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-300 hover:bg-white/8"
              >
                <span className="text-xl leading-none">{f.icon}</span>
                <div>
                  <p className="font-bold text-xs text-white mb-0.5">{f.title}</p>
                  <p className="text-[11px] text-white/50 leading-normal">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-white/30 font-bold tracking-wider relative z-10">
          &copy; {new Date().getFullYear()} UniSalon Inc. All rights reserved.
        </p>
      </div>

      {/* Right panel — Form container */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-6">
          
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Scissors size={18} className="text-primary" />
            <span className="font-display font-black text-lg tracking-tight text-primary">UniSalon</span>
          </div>

          <div>
            <h2 className="font-display font-extrabold text-2xl text-primary tracking-tight mb-1.5">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-xs text-text-secondary font-medium">
              {mode === "login" ? "Sign in to book your next salon slot" : "Register your customer profile to manage bookings"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block">Full Name</label>
                  <input
                    className="us-input !pl-4 !py-2.5 !text-xs border border-border-light hover:border-primary"
                    placeholder="Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block">Phone (Optional)</label>
                  <input
                    className="us-input !pl-4 !py-2.5 !text-xs border border-border-light hover:border-primary"
                    placeholder="9876543210"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                <input
                  className="us-input !py-2.5 !text-xs border border-border-light hover:border-primary"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                <input
                  className="us-input !py-2.5 !text-xs border border-border-light hover:border-primary pr-10"
                  placeholder="••••••••"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary/50"
                >
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center !py-3.5 !text-xs shadow-md mt-2 flex items-center gap-2"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-text-secondary pt-2">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-black text-xs text-primary underline ml-1"
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
