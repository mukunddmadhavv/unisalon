import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession, setIsAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Sign in via Supabase Auth
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!session) throw new Error("Could not initialize session");

      setSession(session);

      // 2. Fetch stats endpoint to verify Admin privileges
      try {
        await api.getStats();
        // If it succeeds, they are admin
        setIsAdmin(true);
        toast.success("Welcome, Administrator!");
        navigate("/dashboard");
      } catch (apiErr) {
        // If it throws an error (e.g., 403), they are not admin
        await supabase.auth.signOut();
        setSession(null);
        setIsAdmin(false);
        throw new Error("Access Denied. Your email is not registered as an Admin.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel - branding & security alerts */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-card border-r border-surface-border flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <span className="text-3xl">✂️</span>
            <span className="font-display font-bold text-2xl">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            System Administration &<br />
            <span className="text-brand-500">Platform Management</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Verify salon partner credentials, audit system logs, review customer activities, and manage platform-wide statistics.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: <ShieldAlert size={20} className="text-brand-500" />, title: "Secure Operations", desc: "Access is restricted to verified administrators" },
            { icon: "📝", title: "Audit Trail Logging", desc: "Every action is logged to prevent unauthorized overrides" },
            { icon: "🏪", title: "Salon Verification Queue", desc: "Carefully inspect listings before allowing them live" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-surface-border">
              <span className="text-2xl mt-0.5">{item.icon}</span>
              <div>
                <p className="font-medium text-white text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - credentials entry */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-xl">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-2">
            Admin Console
          </h2>
          <p className="text-gray-400 mb-8">
            Please log in with your administrative credentials
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Admin Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  className="input pl-9"
                  placeholder="admin@unisalon.in"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
