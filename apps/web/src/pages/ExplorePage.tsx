import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Search, Filter, MapPin, Star, Store, ChevronLeft, ChevronRight, Scissors } from "lucide-react";

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
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: "'Montserrat', Arial, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{
        backgroundColor: "#1a1a1a", padding: "0 30px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Scissors size={20} color="#ffffff" />
          <span style={{ fontWeight: 900, fontSize: 18, color: "#ffffff", letterSpacing: "-0.5px" }}>UniSalon</span>
        </Link>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
          Explore Salons
        </span>
        <Link to="/" style={{
          fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 13, fontWeight: 600,
          color: "rgba(255,255,255,0.6)", textDecoration: "none",
        }}>
          &larr; Home
        </Link>
      </header>

      {/* ── PAGE BODY ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 30px", display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }}>

        {/* ── SIDEBAR FILTERS ── */}
        <aside>
          <div style={{
            background: "#ffffff", border: "1px solid #e4ebf3",
            borderRadius: 24, padding: 24, position: "sticky", top: 88,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Filter size={16} color="#111111" />
              <span style={{ fontWeight: 800, fontSize: 15, color: "#02060c" }}>Filter Salons</span>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
              <label className="label">Keyword</label>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(2,6,12,0.3)" }} />
                <input
                  className="input"
                  style={{ paddingLeft: 40, paddingTop: 10, paddingBottom: 10, fontSize: 13 }}
                  placeholder="Salon name or service..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: 20 }}>
              <label className="label">Category</label>
              <select className="input" style={{ paddingTop: 10, paddingBottom: 10, fontSize: 13 }} value={category} onChange={handleCategoryChange}>
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            {/* District */}
            {!lat && (
              <div style={{ marginBottom: 20 }}>
                <label className="label">District</label>
                <select className="input" style={{ paddingTop: 10, paddingBottom: 10, fontSize: 13 }} value={district} onChange={handleDistrictChange}>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {lat && lng && (
              <div style={{
                background: "#f5f7fa", border: "1px solid #e4ebf3",
                borderRadius: 12, padding: "10px 14px",
                fontSize: 12, color: "rgba(2,6,12,0.55)", fontWeight: 600,
              }}>
                📍 Showing salons within 15km of your GPS location.
              </div>
            )}
          </div>
        </aside>

        {/* ── RESULTS ── */}
        <section>
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#02060c" }}>
              {total > 0 ? `${total} salons found` : "Explore Salons"}
            </h1>
          </div>

          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {[1, 2, 4].map((n) => (
                <div key={n} style={{ height: 260, borderRadius: 24, background: "#f5f7fa" }} />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div style={{ border: "1.5px dashed #e4ebf3", borderRadius: 24, padding: "64px 32px", textAlign: "center" }}>
              <Store size={40} style={{ color: "rgba(2,6,12,0.2)", display: "block", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, fontSize: 16, color: "#02060c" }}>No matching salons found</p>
              <p style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", marginTop: 6 }}>
                Try broader keywords or a different category.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                {shops.map((shop) => (
                  <Link key={shop.id} to={`/shop/${shop.slug}`} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        background: "#ffffff", border: "1px solid #e4ebf3",
                        borderRadius: 24, overflow: "hidden", cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 32px rgba(0,0,0,0.09)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                      }}
                    >
                      <div style={{ aspectRatio: "16/9", background: "#f5f7fa", position: "relative", overflow: "hidden" }}>
                        {shop.coverImage ? (
                          <img src={shop.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "rgba(2,6,12,0.25)" }}>
                            ✂️ UniSalon Partner
                          </div>
                        )}
                        <div style={{
                          position: "absolute", bottom: 10, right: 10,
                          background: "rgba(255,255,255,0.95)", borderRadius: 100,
                          padding: "3px 10px", display: "flex", alignItems: "center", gap: 4,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}>
                          <Star size={11} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#02060c" }}>{shop.rating.toFixed(1)}</span>
                          <span style={{ fontSize: 11, color: "rgba(2,6,12,0.4)" }}>({shop.totalReviews})</span>
                        </div>
                      </div>
                      <div style={{ padding: "16px 18px 18px" }}>
                        <h4 style={{ fontWeight: 700, fontSize: 15, color: "#02060c", marginBottom: 6 }}>{shop.name}</h4>
                        <span className="tag" style={{ marginBottom: 8, display: "inline-block" }}>{shop.category.replace(/_/g, " ")}</span>
                        {shop.description && (
                          <p style={{
                            fontSize: 12, color: "rgba(2,6,12,0.5)", lineHeight: 1.5,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                            marginBottom: 10,
                          }}>
                            {shop.description}
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid #e4ebf3", paddingTop: 10 }}>
                          <MapPin size={12} style={{ color: "rgba(2,6,12,0.3)", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", fontWeight: 500 }}>{shop.city}, {shop.district}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {total > 20 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 40, paddingTop: 24, borderTop: "1px solid #e4ebf3" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-outline"
                    style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 4, opacity: page === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(2,6,12,0.5)" }}>Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-outline"
                    style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 4, opacity: page === totalPages ? 0.4 : 1 }}
                  >
                    Next <ChevronRight size={14} />
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
