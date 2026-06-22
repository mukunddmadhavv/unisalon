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
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Montserrat', Arial, sans-serif" }}>

      {/* Left panel — dark branding */}
      <div className="section-dark" style={{
        width: "45%", flexShrink: 0,
        padding: "48px 56px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        borderBottomRightRadius: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Scissors size={22} color="#ffffff" />
          <span style={{ fontWeight: 900, fontSize: 22, color: "#ffffff", letterSpacing: "-0.5px" }}>UniSalon</span>
        </div>

        {/* Headline */}
        <div>
          <h1 style={{
            fontFamily: "'Montserrat', Arial, sans-serif",
            fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)",
            fontWeight: 900, lineHeight: "1em",
            letterSpacing: "-1px", color: "#ffffff",
            textTransform: "capitalize", marginBottom: 20,
          }}>
            Hair done.<br />
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Price right.</span>
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, lineHeight: "1.6", color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>
            India's salon discovery and booking platform. Reserve time slots on-the-fly, pick your stylist, skip the queue.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16, padding: "14px 18px",
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{f.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#ffffff", marginBottom: 3 }}>{f.title}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
          © {new Date().getFullYear()} UniSalon Inc.
        </p>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 40px", background: "#f5f7fa",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
            <Scissors size={18} color="#02060c" />
            <span style={{ fontWeight: 900, fontSize: 18, color: "#02060c" }}>UniSalon</span>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#02060c", letterSpacing: "-0.5px", marginBottom: 8 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(2,6,12,0.5)", marginBottom: 32 }}>
            {mode === "login" ? "Sign in to book your salon slot" : "Register to manage your bookings"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" placeholder="Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Phone (Optional)</label>
                  <input className="input" placeholder="9876543210" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </>
            )}

            <div>
              <label className="label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(2,6,12,0.3)" }} />
                <input className="input" style={{ paddingLeft: 42 }} placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(2,6,12,0.3)" }} />
                <input
                  className="input" style={{ paddingLeft: 42, paddingRight: 44 }}
                  placeholder="••••••••" type={showPw ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "rgba(2,6,12,0.35)",
                }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: 8, padding: "14px 28px", fontSize: 15 }}>
              {loading && (
                <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", display: "inline-block", marginRight: 8 }} />
              )}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(2,6,12,0.5)", fontWeight: 500, marginTop: 24 }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13, color: "#111111", textDecoration: "underline" }}
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
