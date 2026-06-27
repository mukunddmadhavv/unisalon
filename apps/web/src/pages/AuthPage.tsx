import { useSearchParams } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import { Scissors } from "lucide-react";

type Mode = "login" | "signup";

const FEATURES = [
  { icon: "📅", title: "Instant Confirmations", desc: "Lock your slot in seconds — no waiting queues" },
  { icon: "💵", title: "Pay At Shop", desc: "No online payment. Pay cash at the counter." },
  { icon: "⭐", title: "Verified Stylists", desc: "Check community ratings before you book." },
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as Mode) || "login";

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
        <div className="w-full flex flex-col items-center">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Scissors size={18} className="text-primary" />
            <span className="font-display font-black text-lg tracking-tight text-primary">UniSalon</span>
          </div>

          <div className="w-full max-w-[400px] flex justify-center">
            {mode === "login" ? (
              <SignIn 
                forceRedirectUrl="/" 
                fallbackRedirectUrl="/" 
                signUpUrl="/auth/login?mode=signup"
              />
            ) : (
              <SignUp 
                forceRedirectUrl="/" 
                fallbackRedirectUrl="/" 
                signInUrl="/auth/login?mode=login"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
