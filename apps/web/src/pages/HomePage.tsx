import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth, UserButton } from "@clerk/react";
import { Navigation, Compass, Search } from "lucide-react";
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
  distanceKm?: number | null;
}

const CATEGORIES = [
  { name: "HAIRCUT",    label: "Haircut",   image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzJd0ob1bPIkOt83N0fmE5INkQ0F7ART4vtlT_DHQUBQjYbjAsIDF8j8WOM0nIkEzy9oCBjc1GfQaFZqUXSy4TLUHCgDD0iPKGQKNgf-ax6pgzpwMxdJUx2aNdkBNV0yKfRQIAktiJ-srPtJq3WnVGVS81J71uyewEKS7atPGe9pbO9vHEhHQUG1L7jlI_sSMCDNU1VCUIsZT-PRPaIYyXG1z7WAvybonv-Knkzwh9nWJr1BlZAd-ocsuxfsdNBNvL94jIA4jAzShK" },
  { name: "BEARD",      label: "Beard",     image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrUOBtr0KwfF7av4hAl9gU0NHMOz1qUB2VCzP20BfGLwZu9y8zmpsykkSNE73kAEVhKp0U-IWnAzaemYrg4xF7yQ-sdcoITBAHZHJtvBwjNhk6YDmHB2FZaQSI6Lul99NQB3GD3ab6pa1aS8rNtjco_ZiKv2dbeqoKZRZur1-Rmp4YE1RqAg32GwmncJ_lYHGc9R8QO6kG3eL_bagktkoNJ0Im-CIf0SGChfHr0ZbW5W02S_tb2_fCSS7oyCUFC3eoOhftfBCyzQtx" },
  { name: "FACIAL",     label: "Facial",    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuADG8SfsuTWlSaMouxIKPlnumt97sNaAEPX43owmdMhaT8dZiee3ycfENOPqNbWfbKIxIyEtex7OBRjsKl07BFVUISaIWCsNdzl_7M46lpCBIw-AIP9gTdSUjgo4R8wOiP5ylYpQa8BGg5wwHPEKrXzQvqhCQlmyJp0n3O7w8613zbxZBUC2lFZL5pGo1pB1F69gBykuQP0wC35u08dYPUlOS2JzxOTdTSfehmAjTXStcULPoCfSdIUnuPUJ-mOfXBEkrBfJ2G0Lis7" },
  { name: "MASSAGE",    label: "Spa",       image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs7e8RY46DHRkwSUEdG1fseqcHkUcsWPg3r4osWmbh_Jg0aBx9ehDg6Wfv7yahOVk43PSzKhLCxZWD7G2VW680vphHvPg0DEBSh47zzK1B3oogmL7WUnM552amclJdtKQ-BKaMYdhQIl4z5GiwLKlzn97KNpGKGku0X586RzhXBCttY3_DlvQE2rc2sOyabKf2AgFNDyVnA6vW7Jhxo1dK3DwrTsvPRlQXfOvBvT7gChSjBi1_N4E27iHp_eUM1ke2V3-4CE7K7dLw" },
  { name: "HAIR_COLOR", label: "Color",     image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAS7_WSLSiJaYZocAfer-ZTXwtoH5T-lQaRJc6t816B_ZIeUodfdXPINzKYTGyOvGL4l59OkBfgJxiA5I0bLCQowBTsATNt2rLCHTWopI4iJ70ckeMq_HLCKdrcU_2Rr94wV5h7vwGoQDxPDM6caoZSdgYJXyCMORwF69oheML6k058NoOJd4jVaj7XFm1AXK2GE4PBYBPBM7qcsQLGCmTL4V-1A1d4B9HOy4s5xI3SQbtls6ul2Inv3aPSNZJt_mGSE1Oh3cKwjGY_" },
];

const SEARCH_PLACEHOLDERS = [
  "Search haircuts, beard trims...",
  "Search facials, luxury spas...",
  "Search hair color, hair spa...",
  "Search 'Unisalon' or top salons...",
  "Search grooming, styling, massage...",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const [geoError, setGeoError] = useState(false);
  const [showDistrictSelector, setShowDistrictSelector] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  const [lat, setLat] = useState<string | null>(localStorage.getItem("user-lat"));
  const [lng, setLng] = useState<string | null>(localStorage.getItem("user-lng"));
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    localStorage.getItem("user-district") ?? "Delhi"
  );

  const { data: districts = [], error: districtsError } = useQuery<string[]>({
    queryKey: ["districts"],
    queryFn: () => api.getDistricts(),
  });

  const { data: shopsResponse, isLoading, error: shopsError } = useQuery<{ shops: Shop[]; total: number }>({
    queryKey: ["shops-landing", lat, lng, selectedDistrict, sortBy],
    queryFn: () =>
      api.getShops({
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        district: !lat ? selectedDistrict : undefined,
        radius: lat ? "30" : undefined, // Enforce 30km radius check
        sortBy,
      }),
  });

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
        setShowDistrictSelector(false);
        toast.success("Location resolved! Showing nearby salons.");
      },
      (error) => {
        console.warn("GPS access denied:", error.message);
        setGeoError(true);
        setLat(null);
        setLng(null);
        localStorage.removeItem("user-lat");
        localStorage.removeItem("user-lng");
      }
    );
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    localStorage.setItem("user-district", val);
    setLat(null);
    setLng(null);
    localStorage.removeItem("user-lat");
    localStorage.removeItem("user-lng");
    setGeoError(false);
    setShowDistrictSelector(false);
  };

  const selectDistrictManually = (d: string) => {
    setSelectedDistrict(d);
    localStorage.setItem("user-district", d);
    setLat(null);
    setLng(null);
    localStorage.removeItem("user-lat");
    localStorage.removeItem("user-lng");
    setGeoError(false);
    setShowDistrictSelector(false);
  };

  useEffect(() => {
    if (!lat && !lng && !localStorage.getItem("user-district")) {
      requestLocation();
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const shops = shopsResponse?.shops ?? [];

  console.log("UniSalon Diagnostics:", {
    lat,
    lng,
    district: selectedDistrict,
    isLoadingShops: isLoading,
    shopsCount: shops.length,
    districts,
    districtsError,
    shopsError,
  });

  const isLocationPending = !lat && !lng && !localStorage.getItem("user-district") && !geoError && !showDistrictSelector;
  const isFallbackRequired = showDistrictSelector || geoError || (lat && lng && !isLoading && shops.length === 0);

  return (
    <>
      {/* ── MODALS (ONBOARDING & FALLBACKS) ── */}
      {isLocationPending && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[4px] flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white text-text-primary rounded-2xl border border-border-light p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-slide-up">
            {/* SVG Illustration */}
            <div className="flex justify-center">
              <svg viewBox="0 0 100 100" className="w-20 h-20 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="50" cy="50" r="40" strokeDasharray="5 5" className="stroke-text-secondary/15" />
                <circle cx="50" cy="50" r="26" className="stroke-text-secondary/30" />
                <circle cx="50" cy="50" r="14" className="stroke-black/5 fill-black/5" />
                <g transform="translate(38, 30)">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
                  <circle cx="12" cy="9" r="3" fill="white" />
                </g>
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold font-headline-lg tracking-tight text-primary">Find Salons Near You</h2>
              <p className="text-text-secondary text-xs leading-relaxed">
                UniSalon uses your location to show available premium salons, barbershops, and spa services in your area.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={requestLocation}
                className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs py-3.5 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-black/10 animate-pulse"
              >
                <Compass size={14} />
                Share Location
              </button>
              
              <button
                onClick={() => setShowDistrictSelector(true)}
                className="w-full bg-transparent hover:bg-surface-container text-text-primary border border-border-light font-bold text-xs py-3.5 rounded-xl active:scale-98 transition-all"
              >
                Select District Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {isFallbackRequired && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[4px] flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-white text-text-primary border border-border-light p-8 rounded-2xl max-w-sm w-full shadow-2xl space-y-6 text-center animate-slide-up">
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-text-secondary mb-2">
                <span className="material-symbols-outlined text-[24px]">location_off</span>
              </div>
              <h2 className="text-lg font-bold font-headline-lg text-primary tracking-tight">
                {geoError ? "Location Access Denied" : showDistrictSelector ? "Select District" : "Not in your area yet!"}
              </h2>
              <p className="text-text-secondary text-xs leading-relaxed">
                {geoError
                  ? "We need location access to find nearby salons automatically. Please select one of our operating districts below to browse manually:"
                  : showDistrictSelector
                  ? "Please choose one of our active operating districts to browse available salons:"
                  : "We haven't launched in your location yet. But we are operating in these active districts — select one to browse:"}
              </p>
            </div>

            {districts.length === 0 ? (
              <div className="py-4 text-xs text-text-secondary">Loading active districts...</div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                {districts.map((d) => (
                  <button
                    key={d}
                    onClick={() => selectDistrictManually(d)}
                    className="py-2.5 px-3 bg-surface border border-border-light hover:bg-black hover:text-white hover:border-black rounded-lg text-xs font-bold transition-all truncate active:scale-95"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {!geoError && !showDistrictSelector && (
              <div className="border-t border-border-light pt-4">
                <button
                  onClick={requestLocation}
                  className="text-xs text-primary font-bold hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Compass size={12} /> Retry my GPS Location
                </button>
              </div>
            )}

            {(geoError || showDistrictSelector) && (
              <div className="border-t border-border-light pt-4">
                <button
                  onClick={() => { setGeoError(false); setShowDistrictSelector(false); }}
                  className="text-xs text-text-secondary hover:text-primary transition-colors font-semibold"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN LANDING CONTENT ── */}
      <div className={`min-h-screen bg-background text-text-primary pb-28 font-body-md ${(isLocationPending || isFallbackRequired) ? "blur-[2px] pointer-events-none" : ""}`}>
        
        {/* ── TOP BAR (PREMIUM HEADER) ── */}
        <header className="bg-white sticky top-0 w-full z-50 border-b border-border-light shadow-sm transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 md:py-3.5 flex items-center justify-between gap-2.5 sm:gap-4 w-full">
            
            {/* Logo */}
            <Link to="/" className="font-headline-md text-xl sm:text-2xl md:text-4xl text-primary tracking-tighter hover:opacity-85 font-black shrink-0">
              UNISALON
            </Link>

            {/* Search Input Box (Flexible width, takes up remaining space) */}
            <div className="flex-1 min-w-0 max-w-xl ml-4 sm:ml-6 md:ml-10 w-full mr-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-[#f3f4f6] hover:bg-white border border-transparent hover:border-primary rounded-lg px-3 py-1.5 md:py-2 transition-colors duration-200">
                <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-secondary mr-2 shrink-0" strokeWidth={2.5} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                  className="w-full border-none p-0 bg-transparent text-[11px] md:text-sm text-text-primary focus:ring-0 placeholder:text-text-secondary/70 outline-none truncate"
                />
              </form>
            </div>

            {/* Actions & Navigation */}
            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              <nav className="hidden md:flex items-center gap-8">
                <Link to="/explore" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">local_offer</span>
                  Offers
                </Link>
              </nav>

              <div className="hidden sm:flex items-center gap-2">
                {isSignedIn ? (
                  <UserButton />
                ) : (
                  <Link
                    to="/auth/login"
                    className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>

          </div>
        </header>

        {/* ── SUB-HEADER LOCATION BAR (Flipkart/Zepto style) ── */}
        <div className="bg-background pt-3 pb-0 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white border border-border-light rounded-xl px-4 py-2 flex items-center justify-between text-xs shadow-sm hover:border-primary transition-all duration-200">
              <div className="flex items-center gap-2 text-text-primary">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0">location_on</span>
                <span className="text-text-secondary font-medium">Browsing salons in</span>
                <div className="flex items-center gap-1 font-bold text-primary">
                  {lat && lng ? (
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="flex items-center gap-1 hover:opacity-85 text-left font-extrabold text-xs"
                    >
                      <Navigation size={10} className="fill-primary" />
                      Nearby (GPS)
                    </button>
                  ) : (
                    <div className="relative flex items-center">
                      <select
                        value={selectedDistrict}
                        onChange={handleDistrictChange}
                        className="appearance-none pr-5 bg-transparent font-extrabold text-xs text-primary border-none p-0 outline-none cursor-pointer focus:ring-0"
                      >
                        {districts.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined text-[14px] pointer-events-none absolute right-0 text-text-secondary">expand_more</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowDistrictSelector(true)}
                className="text-[10px] font-bold text-black uppercase tracking-wider hover:underline"
              >
                Change Location
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">

          {/* Hero Promo Banners Carousel / Grid */}
          <section className="py-2 overflow-x-auto no-scrollbar flex md:grid md:grid-cols-2 gap-6 mb-6">
            <div className="min-w-[82vw] sm:min-w-[340px] md:min-w-0 aspect-[21/9] rounded-xl overflow-hidden relative group cursor-pointer border border-border-light shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent z-10"></div>
              <div className="absolute inset-0 z-20 p-5 flex flex-col justify-center text-white">
                <h2 className="font-headline-lg-mobile text-lg md:text-xl text-white leading-tight font-black">
                  First Appointment?<br />
                  <span className="text-secondary-container">50% OFF</span>
                </h2>
                <p className="text-white/90 text-[10px] font-bold tracking-widest mt-1.5 uppercase bg-white/20 px-2 py-0.5 rounded w-fit">Code: LUXE50</p>
              </div>
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt="Luxury salon interior"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkmTO9Uz-IooBN3QOxWRMB1iPUKHvf7Wrh9UT7_nLrpMZJNB67-bopOD67xrqHR9w1TvxdUHUd-t6S6gpkBV_1_1usdNVZZoWVqaicKCZyu2kUDSC6-sxznUXSo-STNUDFVOa4IVFrmRSwqeO-Q6VJw5748cxXO1sG-8hE4FcTv-Sr2iqS5j64qTmw6y7h4qXPVM-LrKbr05jW-6gFDKK5rvaaqxXHsq7zJHfF3uvv4AUlMvdN-XbgaRcrH0xl8DzYSJzQgkH53NqJ"
              />
            </div>

            <div className="min-w-[82vw] sm:min-w-[340px] md:min-w-0 aspect-[21/9] rounded-xl overflow-hidden relative group cursor-pointer border border-border-light shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent z-10"></div>
              <div className="absolute inset-0 z-20 p-5 flex flex-col justify-center text-white">
                <h2 className="font-headline-lg-mobile text-lg md:text-xl text-white leading-tight font-black">
                  Grooming Kits<br />
                  <span className="text-secondary-container">SAVE ₹499</span>
                </h2>
                <p className="text-white/90 text-[10px] font-bold tracking-widest mt-1.5 uppercase bg-white/20 px-2 py-0.5 rounded w-fit">Bundle & Save</p>
              </div>
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt="Male grooming kits"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAtYPy4JSfuQCzjc8e3m2JcQvYHKoiS8t8EjI6iyMsxTX1j3nFpEnb4O5t5ZUlJlaalxSb7RhpHmDORZ42hXIO6gEHm-5L-VFvg1O9oBmXStK3Nx--WZ5KGlHsOvvHTwQKYvE1i1Yvuzb12UdGlc1q2ic-MYPtahqtiA_htMP0plKZWiBz0IaFSbecBYPi1lF0o4CUpxjIDgUKLl_N263Fxt8FtOGiaYlXAAe8QZcxHwJ771rzZ7Y49byGaXk-gmq5mwmbyceVLb1S"
              />
            </div>
          </section>

          {/* Categories Circle roundels */}
          <section className="py-4 mb-4">
            <div className="mb-4">
              <h3 className="font-headline-lg text-lg text-text-primary">What's on your mind?</h3>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-6 md:gap-10 pb-1">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/explore?category=${cat.name}`}
                  className="flex flex-col items-center gap-3 cursor-pointer shrink-0 group"
                >
                  <div className="w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden bg-surface border border-border-light group-hover:border-primary transition-all duration-300 shadow-sm">
                    <img
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                      alt={cat.label}
                      src={cat.image}
                    />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-text-secondary group-hover:text-primary transition-colors tracking-wide">{cat.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="h-px bg-border-light my-4"></div>

          {/* Partners list */}
          <section className="py-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-lg text-lg text-text-primary">Top Rated Salons</h3>
              {lat && lng && (
                <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-lg border border-border-light text-[11px] font-bold">
                  <button
                    onClick={() => setSortBy("distance")}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      sortBy === "distance"
                        ? "bg-white text-primary shadow-sm"
                        : "text-text-secondary hover:text-primary"
                    }`}
                  >
                    Distance
                  </button>
                  <button
                    onClick={() => setSortBy("rating")}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      sortBy === "rating"
                        ? "bg-white text-primary shadow-sm"
                        : "text-text-secondary hover:text-primary"
                    }`}
                  >
                    Rating
                  </button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-xl overflow-hidden bg-white border border-border-light shadow-sm">
                    <div className="skeleton aspect-[16/9] w-full" />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-5 w-1/3" />
                      <div className="skeleton h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : shops.length === 0 ? (
              <div className="border border-dashed border-outline-variant rounded-2xl p-12 text-center bg-white shadow-sm">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">storefront</span>
                <p className="font-bold text-text-primary text-sm">No partners listed yet</p>
                <p className="text-text-secondary text-xs mt-1">We haven't launched in this district yet. Try selecting Delhi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {shops.map((shop) => (
                  <Link
                    key={shop.id}
                    to={`/shop/${shop.slug}`}
                    className="group cursor-pointer block bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      {shop.coverImage ? (
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={shop.name}
                          src={shop.coverImage}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container text-text-secondary text-2xl">
                          ✂️
                        </div>
                      )}
                      {/* Offer Tag Mockup overlay */}
                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded text-primary font-bold text-[10px] tracking-wider uppercase border border-border-light/40">
                        40% OFF
                      </div>
                    </div>

                    <div className="p-4 flex justify-between items-start gap-4">
                      <div className="min-w-0 w-full">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-headline-md text-sm md:text-base text-text-primary group-hover:text-primary transition-colors truncate pr-1">
                            {shop.name}
                          </h4>
                          <div className="bg-rating-green text-white flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                            <span>{shop.rating.toFixed(1)}</span>
                            <span className="material-symbols-outlined !text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary font-medium">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>30-45 mins • ₹600 for two</span>
                        </div>

                        <p className="text-text-secondary text-[11px] mt-1 font-semibold uppercase tracking-wider text-secondary truncate">
                          {shop.category.replace(/_/g, " ")}
                        </p>
                        
                        <p className="text-text-secondary text-xs mt-0.5">
                          {shop.city}, {shop.district}
                          {shop.distanceKm !== undefined && shop.distanceKm !== null
                            ? ` • ${shop.distanceKm.toFixed(1)} km`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* ── PERSISTENT BOTTOM NAV BAR (MOBILE ONLY) ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border-light py-2 px-6 flex justify-around items-center shadow-lg sm:hidden">
          <Link to="/" className="active-nav flex flex-col items-center gap-0.5 text-primary">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            <span className="text-[10px] font-bold">Explore</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-primary">
            <span className="material-symbols-outlined text-[22px]">event_note</span>
            <span className="text-[10px] font-bold">Bookings</span>
          </Link>
          <Link to="/" className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-primary">
            <span className="material-symbols-outlined text-[22px]">local_offer</span>
            <span className="text-[10px] font-bold">Offers</span>
          </Link>
          {isSignedIn ? (
            <div className="flex flex-col items-center gap-0.5 scale-90">
              <UserButton />
              <span className="text-[10px] font-bold text-text-secondary mt-0.5">Profile</span>
            </div>
          ) : (
            <Link to="/auth/login" className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-primary">
              <span className="material-symbols-outlined text-[22px]">person</span>
              <span className="text-[10px] font-bold">Profile</span>
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
