import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Search, Filter, MapPin, Star, Store, ChevronLeft, ChevronRight, Navigation } from "lucide-react";

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

const CATEGORIES = ["HAIRCUT", "BEARD", "FACIAL", "MASSAGE", "HAIR_COLOR", "HAIR_SPA", "OTHER"];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "ALL");
  const [district, setDistrict] = useState(localStorage.getItem("user-district") ?? "Delhi");
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");
  const [page, setPage] = useState(1);

  const lat = localStorage.getItem("user-lat");
  const lng = localStorage.getItem("user-lng");

  const { data: districts = [] } = useQuery<string[]>({
    queryKey: ["districts"],
    queryFn: () => api.getDistricts(),
  });

  const { data: response, isLoading } = useQuery<{ shops: Shop[]; total: number }>({
    queryKey: ["explore-shops", search, category, district, lat, lng, page, sortBy],
    queryFn: () =>
      api.getShops({
        search: search.trim() || undefined,
        category: category !== "ALL" ? category : undefined,
        district: !lat ? district : undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        radius: lat ? "30" : undefined, // Enforce 30km radius check
        page: String(page),
        sortBy,
      }),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
    setSearchParams({ search: e.target.value, category });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategory(val);
    setPage(1);
    setSearchParams({ search, category: val });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDistrict(e.target.value);
    setPage(1);
  };

  const shops = response?.shops ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="min-h-screen bg-background pb-24 font-body-md text-text-primary">
      
      {/* ── TOP NAV BAR ── */}
      <header className="bg-white sticky top-0 w-full px-5 py-4 z-50 flex justify-between items-center border-b border-border-light max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined text-primary text-[24px]">arrow_back</span>
          </Link>
          <h1 className="font-display font-black text-lg tracking-tight text-primary">Discover Salons</h1>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Search Directory</span>
      </header>

      {/* ── SUB-HEADER LOCATION BAR (Flipkart/Zepto style) ── */}
      <div className="bg-white border-b border-border-light py-2.5 px-5 max-w-4xl mx-auto transition-colors duration-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-text-primary">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0">location_on</span>
            <span className="text-text-secondary font-medium">Browsing salons in</span>
            <div className="flex items-center gap-1 font-bold text-primary">
              {lat && lng ? (
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        const latitude = String(pos.coords.latitude);
                        const longitude = String(pos.coords.longitude);
                        localStorage.setItem("user-lat", latitude);
                        localStorage.setItem("user-lng", longitude);
                        window.location.reload();
                      });
                    }
                  }}
                  className="flex items-center gap-1 hover:opacity-85 text-left font-extrabold text-xs"
                >
                  <Navigation size={10} className="fill-primary" />
                  Nearby (GPS)
                </button>
              ) : (
                <div className="relative flex items-center">
                  <select
                    value={district}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDistrict(val);
                      localStorage.setItem("user-district", val);
                      localStorage.removeItem("user-lat");
                      localStorage.removeItem("user-lng");
                    }}
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
        </div>
      </div>

      {/* ── PAGE LAYOUT ── */}
      <div className="max-w-4xl mx-auto mt-6 px-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Filters Sidebar (Left Column) */}
        <aside className="md:col-span-4">
          <div className="bg-white border border-border-light rounded-xl p-5 swiggy-shadow space-y-5 sticky top-24">
            <div className="flex items-center gap-2 border-b border-border-light pb-3">
              <Filter size={16} className="text-primary" />
              <span className="font-bold text-sm text-primary">Filter Search</span>
            </div>

            {/* Keyword search input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 block">Keyword</label>
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                <input
                  className="us-input !py-2.5 !text-xs border border-border-light hover:border-primary pr-4"
                  placeholder="Salon name or service..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Category select dropdown */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 block">Category</label>
              <select
                className="us-input !pl-4 !py-2.5 !text-xs border border-border-light hover:border-primary pr-8 bg-white appearance-none cursor-pointer"
                value={category}
                onChange={handleCategoryChange}
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            {/* District filter */}
            {!lat && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 block">District</label>
                <select
                  className="us-input !pl-4 !py-2.5 !text-xs border border-border-light hover:border-primary pr-8 bg-white appearance-none cursor-pointer"
                  value={district}
                  onChange={handleDistrictChange}
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {lat && lng && (
              <div className="bg-surface-container-low border border-border-light rounded-lg p-3 text-xs text-text-secondary">
                📍 Showing salons within 15km of your active GPS location.
              </div>
            )}
          </div>
        </aside>

        {/* Results Listings (Right Column) */}
        <section className="md:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="font-headline-md text-base text-primary">
              {total > 0 ? `${total} partner salons` : "Explore Salons"}
            </h2>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">Sort by:</span>
              <select
                className="bg-white border border-border-light rounded-lg px-2.5 py-1.5 text-xs text-primary font-bold outline-none cursor-pointer hover:border-primary"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                {lat && lng && <option value="distance">Distance</option>}
                <option value="rating">Rating (Reviews)</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-xl border border-border-light overflow-hidden shadow-sm">
                  <div className="skeleton aspect-[16/9] w-full" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-5 w-1/2" />
                    <div className="skeleton h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="border border-dashed border-outline-variant rounded-xl p-12 text-center bg-white swiggy-shadow">
              <Store size={36} className="text-text-secondary/30 mx-auto mb-3" />
              <p className="font-bold text-sm text-primary">No salons matching search criteria</p>
              <p className="text-xs text-text-secondary mt-1">Try broadening keywords, reset filters or use a different category.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shops.map((shop) => (
                  <Link
                    key={shop.id}
                    to={`/shop/${shop.slug}`}
                    className="group cursor-pointer block bg-white border border-border-light rounded-xl overflow-hidden swiggy-shadow hover:shadow-md transition-all duration-300"
                  >
                    <div className="relative aspect-[16/9] bg-surface-container overflow-hidden">
                      {shop.coverImage ? (
                        <img
                          src={shop.coverImage}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary/40 text-xl font-bold">
                          ✂️
                        </div>
                      )}
                      
                      {/* Rating Overlay */}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-0.5 text-[10px] font-bold text-primary border border-border-light/45 shadow-sm">
                        <Star size={10} className="text-secondary fill-secondary" />
                        <span>{shop.rating.toFixed(1)}</span>
                        <span className="text-text-secondary/70">({shop.totalReviews})</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h4 className="font-headline-md text-sm font-bold text-primary group-hover:text-secondary transition-colors truncate">
                        {shop.name}
                      </h4>
                      <span className="text-[10px] font-bold text-offer-text bg-offer-bg px-2.5 py-0.5 rounded-full border border-offer-text/10 inline-block uppercase tracking-wider">
                        {shop.category.replace(/_/g, " ")}
                      </span>
                      {shop.description && (
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {shop.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1.5 border-t border-border-light pt-3 mt-3 text-[11px] text-text-secondary font-medium">
                        <MapPin size={11} className="text-text-secondary/70 shrink-0" />
                        <span className="truncate">
                          {shop.city}, {shop.district}
                          {shop.distanceKm !== undefined && shop.distanceKm !== null
                            ? ` • ${shop.distanceKm.toFixed(1)} km`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {total > 20 && (
                <div className="flex items-center justify-center gap-4 mt-8 pt-5 border-t border-border-light text-xs">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-outline !py-2 !px-4 flex items-center gap-1 hover:border-primary disabled:opacity-40"
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <span className="text-text-secondary font-bold">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-outline !py-2 !px-4 flex items-center gap-1 hover:border-primary disabled:opacity-40"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
