import { useSearchParams } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";

type Mode = "login" | "signup";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as Mode) || "login";

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

      {/* Right panel — Form container */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0a]">
        <div className="w-full flex flex-col items-center">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-xl">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </div>

          <div className="w-full max-w-[400px] flex justify-center">
            {mode === "login" ? (
              <SignIn 
                forceRedirectUrl="/dashboard" 
                fallbackRedirectUrl="/dashboard" 
                signUpUrl="/auth/login?mode=signup"
              />
            ) : (
              <SignUp 
                forceRedirectUrl="/register" 
                fallbackRedirectUrl="/register" 
                signInUrl="/auth/login?mode=login"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
