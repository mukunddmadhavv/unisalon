import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary pb-28 font-body-md">
      <header className="bg-white sticky top-0 w-full z-50 border-b border-border-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4 w-full">
          <Link to="/" className="text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-headline-md text-xl text-primary font-black">
            Terms of Service
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-border-light p-6 md:p-8 shadow-sm space-y-6">
          <p className="text-sm text-text-secondary">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold font-headline-lg text-primary">1. Acceptance of Terms</h2>
          <p className="text-text-secondary leading-relaxed">
            By accessing and using UniSalon, you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2 className="text-xl font-bold font-headline-lg text-primary pt-4">2. Description of Service</h2>
          <p className="text-text-secondary leading-relaxed">
            UniSalon provides an online platform that connects users with salons, spas, and grooming professionals. 
            We do not provide these services directly and are not responsible for the quality of services provided by our partners.
          </p>

          <h2 className="text-xl font-bold font-headline-lg text-primary pt-4">3. User Responsibilities</h2>
          <p className="text-text-secondary leading-relaxed">
            Users are responsible for maintaining the confidentiality of their account information, honoring their appointments, 
            and ensuring that any information provided to the platform is accurate and up-to-date.
          </p>
          
          <h2 className="text-xl font-bold font-headline-lg text-primary pt-4">4. Cancellations and Refunds</h2>
          <p className="text-text-secondary leading-relaxed">
            Cancellation policies are determined by individual partners. Please review the specific cancellation policy of the 
            salon or professional before booking. Refunds, if applicable, will be processed according to the partner's policy.
          </p>
        </div>
      </main>
    </div>
  );
}
