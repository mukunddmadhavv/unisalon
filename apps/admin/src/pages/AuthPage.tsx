import { SignIn } from "@clerk/react";
import { ShieldAlert } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel - branding & security alerts */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-card border-r border-surface-border flex-col justify-between p-12 text-white">
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

        <div className="space-y-4 text-left">
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

      {/* Right panel - Clerk SignIn */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0a]">
        <div className="w-full flex flex-col items-center">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-xl">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </div>

          <div className="w-full max-w-[400px] flex justify-center">
            <SignIn 
              forceRedirectUrl="/dashboard" 
              fallbackRedirectUrl="/dashboard"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
