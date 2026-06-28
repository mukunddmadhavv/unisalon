import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary pb-28 font-body-md">
      <header className="bg-white sticky top-0 w-full z-50 border-b border-border-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4 w-full">
          <Link to="/" className="text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-headline-md text-xl text-primary font-black">
            About UniSalon
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-border-light p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold font-headline-lg text-primary">Our Mission</h2>
          <p className="text-text-secondary leading-relaxed">
            UniSalon is dedicated to revolutionizing the way you discover and book premium salon, barbershop, and spa services. 
            We believe that finding the perfect grooming or wellness professional should be effortless, reliable, and tailored to your location and preferences.
          </p>

          <h2 className="text-xl font-bold font-headline-lg text-primary pt-4">What We Do</h2>
          <p className="text-text-secondary leading-relaxed">
            We connect you with top-rated local professionals. Whether you need a quick haircut, a relaxing massage, or a complete makeover, 
            UniSalon provides a seamless booking experience, complete with verified reviews, transparent pricing, and instant confirmations.
          </p>

          <h2 className="text-xl font-bold font-headline-lg text-primary pt-4">Contact Us</h2>
          <p className="text-text-secondary leading-relaxed">
            Have questions or feedback? We'd love to hear from you. Reach out to our support team anytime.
            <br />
            Email: <a href="mailto:support@unisalon.com" className="text-primary hover:underline">support@unisalon.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}
