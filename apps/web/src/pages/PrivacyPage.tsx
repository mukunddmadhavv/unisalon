import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary pb-28 font-body-md">
      <header className="bg-white sticky top-0 w-full z-50 border-b border-border-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4 w-full">
          <Link to="/" className="text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-headline-md text-xl text-primary font-black">
            Privacy Policy
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-border-light p-6 md:p-8 shadow-sm space-y-6">
          <p className="text-sm text-text-secondary">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold font-headline-lg text-primary">1. Information We Collect</h2>
          <p className="text-text-secondary leading-relaxed">
            We collect information you provide directly to us, such as when you create or modify your account, 
            request on-demand services, contact customer support, or otherwise communicate with us. This information 
            may include: name, email, phone number, postal address, profile picture, and payment method.
          </p>

          <h2 className="text-xl font-bold font-headline-lg text-primary pt-4">2. Location Data</h2>
          <p className="text-text-secondary leading-relaxed">
            When you use our services to find nearby salons, we collect precise location data from the device you use 
            to access our app or website. You can enable or disable location services in your device settings.
          </p>

          <h2 className="text-xl font-bold font-headline-lg text-primary pt-4">3. How We Use Your Information</h2>
          <p className="text-text-secondary leading-relaxed">
            We use the information we collect about you to provide, maintain, and improve our services, including, 
            for example, to facilitate payments, send receipts, provide products and services you request, develop new features, 
            provide customer support, and send administrative messages.
          </p>
          
          <h2 className="text-xl font-bold font-headline-lg text-primary pt-4">4. Sharing of Information</h2>
          <p className="text-text-secondary leading-relaxed">
            We may share your information with our salon partners to enable them to provide the services you request. 
            We do not sell or share your personal information with third parties for their direct marketing purposes.
          </p>
        </div>
      </main>
    </div>
  );
}
