import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Search, Filter, MapPin, Star, Store, ChevronLeft, ChevronRight } from "lucide-react";

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

const CATEGORIES = ["HAIRCUT", "BEARD", "FACIAL", "MASSAGE", "HAIR_COLOR", "HAIR_SPA", "OTHER"];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "ALL");
  const [district, setDistrict] = useState(localStorage.getItem("user-district") ?? "Delhi");
  const [page, setPage] = useState(1);

  const lat = localStorage.getItem("user-lat");
  const lng = localStorage.getItem("user-lng");

  const { data: districts = [] } = useQuery<string[]>({
    queryKey: ["districts"],
    queryFn: () => api.getDistricts(),
  });

  const { data: response, isLoading } = useQuery<{ shops: Shop[]; total: number }>({
    queryKey: ["explore-shops", search, category, district, lat, lng, page],
    queryFn: () =>
      api.getShops({
        search: search.trim() || undefined,
        category: category !== "ALL" ? category : undefined,
        district: !lat ? district : undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        radius: lat ? "15" : undefined,
        page: String(page),
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
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header bar */}
      <header className="px-6 py-4 bg-surface-card border-b border-surface-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <span className="font-display font-bold text-lg">
              <span className="text-brand-500">Uni</span>Salon
            </span>
          </Link>
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Search Partners</span>
        </div>
      </header>

      {/* Grid container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Filter controls */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="card p-5 space-y-5 sticky top-24">
            <h3 className="font-display font-semibold text-white flex items-center gap-2 text-md">
              <Filter size={16} className="text-brand-500" /> Filter Salons
            </h3>

            {/* Keyword Search */}
            <div className="space-y-1.5">
              <label className="label text-xs">Search Query</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  className="input pl-8 py-2 text-xs"
                  placeholder="Salon name or service..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="label text-xs">Category</label>
              <select className="input py-2 text-xs" value={category} onChange={handleCategoryChange}>
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Fallback District selection */}
            {!lat && (
              <div className="space-y-1.5">
                <label className="label text-xs">District</label>
                <select className="input py-2 text-xs" value={district} onChange={handleDistrictChange}>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {lat && lng && (
              <div className="text-xs bg-brand-500/5 text-brand-400 border border-brand-500/10 p-3 rounded-xl">
                📍 Showing salons within 15km of your active GPS location.
              </div>
            )}
          </div>
        </aside>

        {/* Right Side: Grid of salons */}
        <section className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 4].map((n) => (
                <div key={n} className="card h-64 animate-pulse bg-surface-card/40" />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="card p-16 text-center text-gray-500 mt-4">
              <Store size={40} className="mx-auto text-gray-600 mb-3" />
              <p className="font-semibold text-white">No matching salons found</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">Try broadening your search keywords or choosing a different category filter.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shops.map((shop) => (
                  <Link
                    key={shop.id}
                    to={`/shop/${shop.slug}`}
                    className="card group overflow-hidden flex flex-col hover:border-brand-500/30 transition-all hover:-translate-y-0.5 duration-200"
                  >
                    <div className="aspect-video relative overflow-hidden bg-surface">
                      {shop.coverImage ? (
                        <img src={shop.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-display font-bold text-gray-700">
                          ✂️ UniSalon Partner
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-surface-card/95 border border-surface-border/50 rounded-xl px-2 py-1 flex items-center gap-1 text-xs">
                        <Star size={11} className="text-yellow-400 fill-current" />
                        <span className="font-bold text-white">{shop.rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-[10px]">({shop.totalReviews})</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                          {shop.name}
                        </h4>
                        <span className="text-[10px] bg-brand-500/10 text-brand-400 font-semibold px-2 py-0.5 rounded-full border border-brand-500/20 mt-1 inline-block">
                          {shop.category}
                        </span>
                        {shop.description && (
                          <p className="text-xs text-gray-500 mt-2.5 leading-relaxed line-clamp-2">{shop.description}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-surface-border flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin size={12} className="text-gray-500" />
                        <span className="truncate">{shop.city}, {shop.district}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination control */}
              {total > 20 && (
                <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-surface-border">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-outline py-1.5 px-3 flex items-center gap-1 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-xs text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-outline py-1.5 px-3 flex items-center gap-1 text-xs disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
