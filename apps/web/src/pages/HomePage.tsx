import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { LogOut, Navigation, Compass } from "lucide-react";
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
  { name: "HAIRCUT",    label: "Haircut",   image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzJd0ob1bPIkOt83N0fmE5INkQ0F7ART4vtlT_DHQUBQjYbjAsIDF8j8WOM0nIkEzy9oCBjc1GfQaFZqUXSy4TLUHCgDD0iPKGQKNgf-ax6pgzpwMxdJUx2aNdkBNV0yKfRQIAktiJ-srPtJq3WnVGVS81J71uyewEKS7atPGe9pbO9vHEhHQUG1L7jlI_sSMCDNU1VCUIsZT-PRPaIYyXG1z7WAvybonv-Knkzwh9nWJr1BlZAd-ocsuxfsdNBNvL94jIA4jAzShK" },
  { name: "BEARD",      label: "Beard",     image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrUOBtr0KwfF7av4hAl9gU0NHMOz1qUB2VCzP20BfGLwZu9y8zmpsykkSNE73kAEVhKp0U-IWnAzaemYrg4xF7yQ-sdcoITBAHZHJtvBwjNhk6YDmHB2FZaQSI6Lul99NQB3GD3ab6pa1aS8rNtjco_ZiKv2dbeqoKZRZur1-Rmp4YE1RqAg32GwmncJ_lYHGc9R8QO6kG3eL_bagktkoNJ0Im-CIf0SGChfHr0ZbW5W02S_tb2_fCSS7oyCUFC3eoOhftfBCyzQtx" },
  { name: "FACIAL",     label: "Facial",    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuADG8SfsuTWlSaMouxIKPlnumt97sNaAEPX43owmdMhaT8dZiee3ycfENOPqNbWfbKIxIyEtex7OBRjsKl07BFVUISaIWCsNdzl_7M46lpCBIw-AIP9gTdSUjgo4R8wOiP5ylYpQa8BGg5wwHPEKrXzQvqhCQlmyJp0n3O7w8613zbxZBUC2lFZL5pGo1pB1F69gBykuQP0wC35u08dYPUlOS2JzxOTdTSfehmAjTXStcULPoCfSdIUnuPUJ-mOfXBEkrBfJ2G0Lis7" },
  { name: "MASSAGE",    label: "Spa",       image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs7e8RY46DHRkwSUEdG1fseqcHkUcsWPg3r4osWmbh_Jg0aBx9ehDg6Wfv7yahOVk43PSzKhLCxZWD7G2VW680vphHvPg0DEBSh47zzK1B3oogmL7WUnM552amclJdtKQ-BKaMYdhQIl4z5GiwLKlzn97KNpGKGku0X586RzhXBCttY3_DlvQE2rc2sOyabKf2AgFNDyVnA6vW7Jhxo1dK3DwrTsvPRlQXfOvBvT7gChSjBi1_N4E27iHp_eUM1ke2V3-4CE7K7dLw" },
  { name: "HAIR_COLOR", label: "Color",     image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAS7_WSLSiJaYZocAfer-ZTXwtoH5T-lQaRJc6t816B_ZIeUodfdXPINzKYTGyOvGL4l59OkBfgJxiA5I0bLCQowBTsATNt2rLCHTWopI4iJ70ckeMq_HLCKdrcU_2Rr94wV5h7vwGoQDxPDM6caoZSdgYJXyCMORwF69oheML6k058NoOJd4jVaj7XFm1AXK2GE4PBYBPBM7qcsQLGCmTL4V-1A1d4B9HOy4s5xI3SQbtls6ul2Inv3aPSNZJt_mGSE1Oh3cKwjGY_" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");

  const [geoError, setGeoError] = useState(false);
  const [lat, setLat] = useState<string | null>(localStorage.getItem("user-lat"));
  const [lng, setLng] = useState<string | null>(localStorage.getItem("user-lng"));
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    localStorage.getItem("user-district") ?? "Delhi"
  );

  const { data: districts = [] } = useQuery<string[]>({
    queryKey: ["districts"],
    queryFn: () => api.getDistricts(),
  });

  const { data: shopsResponse, isLoading } = useQuery<{ shops: Shop[]; total: number }>({
    queryKey: ["shops-landing", lat, lng, selectedDistrict],
    queryFn: () =>
      api.getShops({
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        district: !lat ? selectedDistrict : undefined,
        radius: lat ? "10" : undefined,
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
  };

  useEffect(() => {
    if (!lat && !lng && !localStorage.getItem("user-district")) requestLocation();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const shops = shopsResponse?.shops ?? [];

  return (
    <div className="min-h-screen bg-background text-text-primary pb-28 font-body-md">
      
      {/* ── TOP BAR (SWIGGY HEADER) ── */}
      <header className="bg-white sticky top-0 w-full px-5 py-3.5 z-50 flex justify-between items-center border-b border-border-light shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Location</span>
            <div className="flex items-center gap-1">
              {lat && lng ? (
                <button
                  type="button"
                  onClick={requestLocation}
                  className="font-headline-md text-sm text-primary flex items-center gap-1 hover:opacity-80 text-left font-bold"
                >
                  <Navigation size={12} className="fill-primary" />
                  Nearby (GPS)
                </button>
              ) : (
                <div className="relative flex items-center">
                  <select
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    className="appearance-none pr-6 bg-transparent font-headline-md text-sm font-bold text-primary border-none p-0 outline-none cursor-pointer focus:ring-0"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-[16px] pointer-events-none absolute right-0 text-text-secondary">expand_more</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile / Actions */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full overflow-hidden border border-border-light flex items-center justify-center bg-surface-container"
              >
                <img
                  className="w-full h-full object-cover"
                  alt="Profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmG0j0iZNOMdjBk4SHHdDERG3_apqIYDx-LYWyFfendiqU-Wer8C3Djlu_zaLXQskHZZ4cuRMImn_9qM6H--1n7rmuZEqXidV00LnhFKPvaurPNZ5jwQJhXtMfEj3ZkQNkDFVd3Anz3Cs_ZxzQpHCXVZCYMq788JrbWYGoSrdb4SdZMyWgyy9uWazUWvCgOmjk4BuPWS8bkMxEzKweaGpyiqGL_dfRBBQCwCGQE5L91sfDUai7xDptZKWGA4sUiTp-CQyl-76WiljI"
                />
              </Link>
              <button
                onClick={() => { signOut(); toast.success("Signed out"); }}
                className="p-2 hover:bg-surface-container rounded-full text-text-secondary hover:text-primary transition-all duration-150"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-4xl mx-auto">
        
        {/* Search Input Box */}
        <section className="px-5 py-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white border border-border-light rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for salons, services or more"
              className="w-full border-none p-0 bg-transparent text-sm text-text-primary focus:ring-0 placeholder:text-text-secondary/70 outline-none"
            />
            <button type="submit" className="absolute right-4 text-text-secondary flex items-center">
              <span className="material-symbols-outlined">search</span>
            </button>
          </form>

          {geoError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary bg-surface-container p-2.5 rounded-lg border border-border-light animate-fade-in">
              <Compass size={13} className="text-secondary shrink-0" />
              <span>GPS unavailable — listing salons in {selectedDistrict}.</span>
              <button onClick={requestLocation} className="text-primary font-bold underline ml-auto">Retry GPS</button>
            </div>
          )}
        </section>

        {/* Hero Promo Banners Carousel */}
        <section className="px-5 py-2 overflow-x-auto no-scrollbar flex gap-4">
          <div className="min-w-[82vw] sm:min-w-[340px] aspect-[21/9] rounded-xl overflow-hidden relative group cursor-pointer border border-border-light">
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent z-10"></div>
            <div className="absolute inset-0 z-20 p-5 flex flex-col justify-center text-white">
              <h2 className="font-headline-lg-mobile text-lg text-white leading-tight font-black">
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

          <div className="min-w-[82vw] sm:min-w-[340px] aspect-[21/9] rounded-xl overflow-hidden relative group cursor-pointer border border-border-light">
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent z-10"></div>
            <div className="absolute inset-0 z-20 p-5 flex flex-col justify-center text-white">
              <h2 className="font-headline-lg-mobile text-lg text-white leading-tight font-black">
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
        <section className="py-6">
          <div className="px-5 mb-4">
            <h3 className="font-headline-md text-base text-text-primary">What's on your mind?</h3>
          </div>
          <div className="flex overflow-x-auto no-scrollbar px-5 gap-5 pb-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/explore?category=${cat.name}`}
                className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-surface border border-border-light hover:border-primary transition-all duration-300 shadow-sm">
                  <img
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    alt={cat.label}
                    src={cat.image}
                  />
                </div>
                <span className="text-[11px] font-bold text-text-primary tracking-wide">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border-light mx-5"></div>

        {/* Partners list */}
        <section className="py-6 px-5">
          <h3 className="font-headline-md text-base text-text-primary mb-5">Salons for you</h3>

          {isLoading ? (
            <div className="flex flex-col gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="rounded-xl overflow-hidden bg-white border border-border-light">
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
            <div className="flex flex-col gap-6">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shop/${shop.slug}`}
                  className="group cursor-pointer block bg-white rounded-xl border border-border-light overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="relative aspect-[21/9] w-full overflow-hidden">
                    {shop.coverImage ? (
                      <img
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
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
                      ₹200 OFF
                    </div>
                  </div>

                  <div className="p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="font-headline-md text-base text-text-primary group-hover:text-secondary transition-colors truncate">
                        {shop.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-text-secondary font-medium">
                        <div className="bg-rating-green text-white flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          <span>{shop.rating.toFixed(1)}</span>
                          <span className="material-symbols-outlined !text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                        <span className="text-text-primary font-bold text-[11px]">• 25-30 mins</span>
                      </div>
                      <p className="text-text-secondary text-xs mt-1 font-semibold uppercase tracking-wider text-secondary">
                        {shop.category.replace(/_/g, " ")}
                      </p>
                      <p className="text-text-secondary text-xs mt-0.5">
                        {shop.city}, {shop.district} • 2.5 km
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
        <Link to="/profile" className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-primary">
          <span className="material-symbols-outlined text-[22px]">person</span>
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
