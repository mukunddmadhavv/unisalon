import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

type Mode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, phone, role: "OWNER" } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-card border-r border-surface-border flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <span className="text-3xl">✂️</span>
            <span className="font-display font-bold text-2xl">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Grow your salon<br />
            <span className="text-brand-500">with UniSalon</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            List your salon, manage bookings, track revenue, and get discovered by thousands of customers across India.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: "📅", title: "Smart Booking Management", desc: "Real-time slot booking with zero double-bookings" },
            { icon: "👥", title: "Multi-Staff Support", desc: "Manage your entire team with individual profiles" },
            { icon: "🔔", title: "Instant Notifications", desc: "Get alerted the moment a booking is made" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-surface-border">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-medium text-white text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-xl">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-2">
            {mode === "login" ? "Welcome back" : "List your salon"}
          </h2>
          <p className="text-gray-400 mb-8">
            {mode === "login"
              ? "Sign in to your shop dashboard"
              : "Create your shop owner account to get started"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="label">Full name</label>
                  <input className="input" placeholder="Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Phone number</label>
                  <input className="input" placeholder="9876543210" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </>
            )}

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input className="input pl-9" placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input className="input pl-9 pr-10" placeholder="••••••••" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {mode === "login" ? "Sign in to Dashboard" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-brand-400 hover:text-brand-300 font-medium"
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
