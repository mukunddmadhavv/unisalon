import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { MapPin, Search, Navigation, Compass, Star, LogOut, User } from "lucide-react";
import toast from "react-hot-toast";

interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  coverImage?: string;
  rating: number;
  totalReviews: number;
  city: string;
  district: string;
}

const CATEGORIES = [
  { name: "HAIRCUT", emoji: "💇‍♂️", label: "Haircut" },
  { name: "BEARD", emoji: "🧔", label: "Beard Grooming" },
  { name: "FACIAL", emoji: "🧴", label: "Facial Care" },
  { name: "MASSAGE", emoji: "💆", label: "Massage" },
  { name: "HAIR_COLOR", emoji: "🎨", label: "Hair Color" },
  { name: "HAIR_SPA", emoji: "🧼", label: "Hair Spa" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [geoError, setGeoError] = useState(false);

  // Geolocation States
  const [lat, setLat] = useState<string | null>(localStorage.getItem("user-lat"));
  const [lng, setLng] = useState<string | null>(localStorage.getItem("user-lng"));
  const [selectedDistrict, setSelectedDistrict] = useState<string>(localStorage.getItem("user-district") ?? "Delhi");

  // Fetch districts list for fallback
  const { data: districts = [] } = useQuery<string[]>({
    queryKey: ["districts"],
    queryFn: () => api.getDistricts(),
  });

  // Fetch shops based on lat/lng or fallback district
  const { data: shopsResponse, isLoading } = useQuery<{ shops: Shop[]; total: number }>({
    queryKey: ["shops-landing", lat, lng, selectedDistrict],
    queryFn: () =>
      api.getShops({
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        district: !lat ? selectedDistrict : undefined,
        radius: lat ? "10" : undefined, // 10km radius if GPS works
      }),
  });

  // Geolocation trigger
  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setGeoError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = String(position.coords.latitude);
        const longitude = String(position.coords.longitude);
        setLat(latitude);
        setLng(longitude);
        localStorage.setItem("user-lat", latitude);
        localStorage.setItem("user-lng", longitude);
        setGeoError(false);
        toast.success("Location resolved! Showing nearby salons.");
      },
      (error) => {
        console.warn("GPS access denied:", error.message);
        setGeoError(true);
        // Ensure GPS storage is cleared on denial so it falls back to district
        setLat(null);
        setLng(null);
        localStorage.removeItem("user-lat");
        localStorage.removeItem("user-lng");
      }
    );
  };

  useEffect(() => {
    // Try to auto-fetch location on first mount if not set
    if (!lat && !lng && !localStorage.getItem("user-district")) {
      requestLocation();
    }
  }, []);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    localStorage.setItem("user-district", val);
    // Clear GPS coordinates so district filter is preferred
    setLat(null);
    setLng(null);
    localStorage.removeItem("user-lat");
    localStorage.removeItem("user-lng");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const shops = shopsResponse?.shops ?? [];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header bar */}
      <header className="px-6 py-4 bg-surface-card/30 backdrop-blur-md border-b border-surface-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-lg">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </Link>

          {/* Location selector in Header */}
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-brand-400" />
            {lat && lng ? (
              <button
                onClick={requestLocation}
                className="text-xs font-semibold text-white bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg border border-brand-500/20 transition-all flex items-center gap-1"
              >
                <Navigation size={10} className="fill-current animate-pulse" /> Nearby (GPS Active)
              </button>
            ) : (
              <select
                className="bg-transparent text-xs font-semibold text-white focus:outline-none border border-surface-border hover:border-brand-500 rounded-lg px-2 py-1.5 cursor-pointer transition-colors"
                value={selectedDistrict}
                onChange={handleDistrictChange}
              >
                {districts.map((d) => (
                  <option key={d} value={d} className="bg-surface-card text-white">
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Link to="/profile" className="btn-outline flex items-center gap-2 py-1.5 px-3 text-xs">
                  <User size={13} /> My Bookings
                </Link>
                <button
                  onClick={() => { signOut(); toast.success("Signed out successfully"); }}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/auth/login" className="btn-primary py-1.5 px-4 text-xs font-bold">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative px-6 py-20 bg-gradient-to-b from-brand-500/5 to-transparent border-b border-surface-border/50 text-center flex flex-col items-center">
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white leading-tight max-w-3xl">
          Discover & Book the Best Salons{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-amber-500">
            Near You
          </span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-xl mt-4 leading-relaxed">
          Zomato-style discovery for haircuts, beard styling, grooming, and spas in India. Skip the waiting queue, reserve time slots on-the-fly.
        </p>

        {/* Search Input bar */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-lg mt-8 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            className="w-full bg-surface-card border border-surface-border text-white placeholder-gray-500 rounded-2xl pl-12 pr-28 py-4 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm shadow-xl"
            placeholder="Search by salon name or services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-primary absolute right-2 top-2 py-2 px-5 text-xs font-bold rounded-xl">
            Find Salons
          </button>
        </form>

        {geoError && (
          <div className="mt-4 text-xs bg-yellow-500/10 text-yellow-500/90 border border-yellow-500/20 px-4 py-2 rounded-xl flex items-center gap-2 animate-fade-in">
            <Compass size={14} className="animate-spin" />
            <span>GPS declined or unavailable. Falling back to select-district listings dropdown.</span>
            <button onClick={requestLocation} className="underline font-bold text-white ml-1 hover:text-brand-400">
              Try again
            </button>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Categories Section */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-xl text-white">Browse Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/explore?category=${cat.name}`}
                className="card p-5 text-center flex flex-col items-center justify-center gap-3 hover:border-brand-500/50 hover:bg-surface-card/80 transition-all duration-200 hover:-translate-y-1 active:scale-95 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.emoji}</span>
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Salons Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-xl text-white">
              {lat && lng ? "Salons Near You (Within 10km)" : `Top Salons in ${selectedDistrict}`}
            </h2>
            <Link to="/explore" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all salons &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card h-80 animate-pulse bg-surface-card/40" />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="card p-12 text-center text-gray-500 border-dashed border-surface-border">
              <span className="text-4xl">🏪</span>
              <h3 className="font-display font-semibold text-white mt-3">No partners listed yet</h3>
              <p className="text-sm mt-1 max-w-sm mx-auto">We haven't launched listed salons in this district yet. Try selecting "Delhi" in the location picker.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shop/${shop.slug}`}
                  className="card group overflow-hidden flex flex-col hover:border-brand-500/30 transition-all hover:-translate-y-1 duration-200"
                >
                  {/* Photo */}
                  <div className="aspect-video w-full relative bg-surface overflow-hidden">
                    {shop.coverImage ? (
                      <img
                        src={shop.coverImage}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 font-display font-bold">
                        ✂️ UniSalon Partner
                      </div>
                    )}
                    {/* Rating badge */}
                    <div className="absolute bottom-3 right-3 bg-surface-card/90 backdrop-blur border border-surface-border/50 rounded-xl px-2 py-1 flex items-center gap-1 text-xs">
                      <Star size={12} className="text-yellow-400 fill-current" />
                      <span className="font-bold text-white">{shop.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-[10px]">({shop.totalReviews})</span>
                    </div>
                  </div>

                  {/* Summary details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors text-lg">
                          {shop.name}
                        </h3>
                      </div>
                      <p className="text-xs text-brand-500 mt-0.5 font-medium">{shop.category}</p>
                      {shop.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                          {shop.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin size={12} className="text-gray-500" />
                      <span className="truncate">{shop.city}, {shop.district}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-surface-card/20 border-t border-surface-border text-center text-xs text-gray-600 mt-12">
        <p>&copy; {new Date().getFullYear()} UniSalon Inc. Zomato-style bookings marketplace for India.</p>
      </footer>
    </div>
  );
}
