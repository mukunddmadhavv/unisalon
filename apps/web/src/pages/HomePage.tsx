import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { MapPin, Search, Navigation, Compass, Star, LogOut, User, Scissors } from "lucide-react";
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
  { name: "HAIRCUT",    emoji: "💇‍♂️", label: "Haircut" },
  { name: "BEARD",      emoji: "🧔",   label: "Beard Grooming" },
  { name: "FACIAL",     emoji: "🧴",   label: "Facial Care" },
  { name: "MASSAGE",    emoji: "💆",   label: "Massage" },
  { name: "HAIR_COLOR", emoji: "🎨",   label: "Hair Color" },
  { name: "HAIR_SPA",   emoji: "🧼",   label: "Hair Spa" },
];

const FEATURES = [
  {
    emoji: "🏷️",
    title: "Offline Prices,\nOnline Convenience",
    sub: "Pay what you see on the salon's menu board",
  },
  {
    emoji: "⚡",
    title: "Instant Slot\nBooking",
    sub: "90-second atomic hold prevents double-booking",
  },
  {
    emoji: "🚀",
    title: "Skip the Queue\nCompletely",
    sub: "Walk in exactly at your slot, no waiting needed",
  },
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

  useEffect(() => {
    if (!lat && !lng && !localStorage.getItem("user-district")) requestLocation();
  }, []);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    localStorage.setItem("user-district", val);
    setLat(null);
    setLng(null);
    localStorage.removeItem("user-lat");
    localStorage.removeItem("user-lng");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const shops = shopsResponse?.shops ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff", fontFamily: "'Montserrat', Arial, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        backgroundColor: "#1a1a1a",
        padding: "0 30px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Scissors size={20} color="#ffffff" />
          <span style={{ fontWeight: 900, fontSize: 20, color: "#ffffff", letterSpacing: "-0.5px" }}>
            UniSalon
          </span>
        </Link>

        {/* Location pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color="rgba(255,255,255,0.5)" />
          {lat && lng ? (
            <button onClick={requestLocation} style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 100, padding: "5px 14px", color: "#ffffff",
              fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Navigation size={10} style={{ fill: "white" }} /> Nearby (GPS)
            </button>
          ) : (
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              style={{
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 100, padding: "5px 14px", color: "#ffffff",
                fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none",
              }}
            >
              {districts.map((d) => (
                <option key={d} value={d} style={{ background: "#1a1a1a", color: "#fff" }}>{d}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {session ? (
            <>
              <Link to="/profile" className="btn-outline" style={{
                padding: "8px 16px", fontSize: 13, borderColor: "rgba(255,255,255,0.2)",
                color: "#ffffff", gap: 6,
              }}>
                <User size={13} /> My Bookings
              </Link>
              <button onClick={() => { signOut(); toast.success("Signed out"); }} style={{
                background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)",
              }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/auth/login" className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── HERO BANNER (Toingit-style dark rounded section) ── */}
      <div className="section-dark" style={{ padding: "72px 30px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          {/* Left: headline + search */}
          <div style={{ flex: "1 1 auto", maxWidth: 600 }}>
            <p style={{
              fontSize: 13, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)", marginBottom: 16,
            }}>
              India's Salon Discovery Platform
            </p>
            <h1 style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "clamp(2.8rem, 5vw, 4.7rem)",
              fontWeight: 900,
              lineHeight: "1em",
              letterSpacing: "-1px",
              color: "#ffffff",
              margin: "0 0 24px 0",
              textTransform: "capitalize",
            }}>
              Hair done.<br />
              <span style={{ color: "rgba(255,255,255,0.45)" }}>Price right.</span>
            </h1>
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: "1.6", color: "rgba(255,255,255,0.65)", marginBottom: 32 }}>
              Discover salons, book slots instantly, skip the waiting queue — across India.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} style={{ position: "relative", maxWidth: 520 }}>
              <Search size={16} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "rgba(2,6,12,0.4)" }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search salons, services, cities..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#ffffff", border: "none", borderRadius: 15,
                  padding: "16px 140px 16px 48px",
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: 14, fontWeight: 500, color: "#02060c", outline: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                }}
              />
              <button type="submit" className="btn-primary" style={{
                position: "absolute", right: 6, top: 6, bottom: 6,
                padding: "0 20px", fontSize: 13, borderRadius: 10,
              }}>
                Find Salons
              </button>
            </form>

            {geoError && (
              <div style={{
                marginTop: 12, display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12, padding: "10px 16px",
              }}>
                <Compass size={14} color="rgba(255,255,255,0.6)" />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  GPS unavailable — using district filter.
                </span>
                <button onClick={requestLocation} style={{
                  fontSize: 12, fontWeight: 700, color: "#ffffff", background: "none",
                  border: "none", cursor: "pointer", textDecoration: "underline",
                }}>
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Right: decorative element */}
          <div style={{
            flex: "0 0 auto", width: 300, height: 300,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 120,
          }}>
            ✂️
          </div>
        </div>
      </div>

      {/* ── FEATURES SECTION ── */}
      <div style={{ backgroundColor: "#ffffff", paddingTop: 80, paddingBottom: 80, paddingLeft: 30, paddingRight: 30 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#02060c", letterSpacing: "-0.5px", textAlign: "center" }}>
              What you get to enjoy
            </h1>
          </div>
          <p style={{ textAlign: "center", color: "rgba(2,6,12,0.55)", fontSize: 16, fontWeight: 500, marginBottom: 48 }}>
            Booking that just works — no queues, no surprises.
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{
                flex: "1 1 300px", minWidth: 280,
                padding: "40px 40px 40px 40px",
                marginTop: i === 1 ? 0 : 40,
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{f.emoji}</div>
                <div style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: 22, fontWeight: 700, lineHeight: "28px",
                  color: "#02060c", whiteSpace: "pre-line", marginBottom: 8,
                }}>
                  {f.title}
                </div>
                <div style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: 16, fontWeight: 500, lineHeight: "22px",
                  color: "rgba(2,6,12,0.6)",
                }}>
                  {f.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORIES SECTION ── */}
      <div style={{ backgroundColor: "#f5f7fa", paddingTop: 64, paddingBottom: 80, paddingLeft: 30, paddingRight: 30 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#02060c", letterSpacing: "-0.5px", textAlign: "center" }}>
              Browse by category
            </h1>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/explore?category=${cat.name}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  background: "#ffffff", border: "1px solid #e4ebf3",
                  borderRadius: 20, padding: "24px 16px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  cursor: "pointer", transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#111111";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#e4ebf3";
                  }}
                >
                  <span style={{ fontSize: 36 }}>{cat.emoji}</span>
                  <span style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 13, fontWeight: 700, color: "#02060c", textAlign: "center" }}>
                    {cat.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── SALONS GRID ── */}
      <div style={{ backgroundColor: "#ffffff", paddingTop: 64, paddingBottom: 80, paddingLeft: 30, paddingRight: 30 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#02060c", letterSpacing: "-0.5px" }}>
              {lat && lng ? "Salons Near You" : `Top Salons in ${selectedDistrict}`}
            </h1>
            <Link to="/explore" style={{
              fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 14, fontWeight: 700,
              color: "#111111", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              View all &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{
                  height: 320, borderRadius: 24, background: "#f5f7fa",
                  animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                }} />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div style={{
              border: "1.5px dashed #e4ebf3", borderRadius: 24, padding: "64px 32px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: "#02060c", marginBottom: 8 }}>No partners listed yet</h3>
              <p style={{ color: "rgba(2,6,12,0.5)", fontSize: 14 }}>
                We haven't launched in this district yet. Try selecting Delhi.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {shops.map((shop) => (
                <Link key={shop.id} to={`/shop/${shop.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#ffffff", border: "1px solid #e4ebf3",
                    borderRadius: 24, overflow: "hidden",
                    transition: "all 0.2s ease", cursor: "pointer",
                  }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }}
                  >
                    {/* Cover image */}
                    <div style={{ aspectRatio: "16/9", position: "relative", overflow: "hidden", background: "#f5f7fa" }}>
                      {shop.coverImage ? (
                        <img src={shop.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{
                          width: "100%", height: "100%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 700,
                          fontSize: 14, color: "rgba(2,6,12,0.3)",
                        }}>
                          ✂️ UniSalon Partner
                        </div>
                      )}
                      {/* Rating badge */}
                      <div style={{
                        position: "absolute", bottom: 12, right: 12,
                        background: "rgba(255,255,255,0.95)", borderRadius: 100,
                        padding: "4px 10px", display: "flex", alignItems: "center", gap: 4,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                      }}>
                        <Star size={12} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                        <span style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 12, fontWeight: 700, color: "#02060c" }}>
                          {shop.rating.toFixed(1)}
                        </span>
                        <span style={{ fontSize: 11, color: "rgba(2,6,12,0.4)" }}>({shop.totalReviews})</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: "20px 20px 20px" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#02060c", marginBottom: 4 }}>{shop.name}</h3>
                      <span className="tag" style={{ marginBottom: 8, display: "inline-block" }}>{shop.category}</span>
                      {shop.description && (
                        <p style={{
                          fontSize: 13, color: "rgba(2,6,12,0.55)", lineHeight: "1.5",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          marginBottom: 12,
                        }}>
                          {shop.description}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid #e4ebf3", paddingTop: 12 }}>
                        <MapPin size={12} style={{ color: "rgba(2,6,12,0.35)", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "rgba(2,6,12,0.5)", fontWeight: 500 }}>
                          {shop.city}, {shop.district}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        backgroundColor: "#f5f7fa", borderTop: "1px solid #e4ebf3",
        padding: "40px 30px 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Scissors size={18} color="#02060c" />
            <span style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 900, fontSize: 16, color: "#02060c" }}>UniSalon</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms & Conditions", "Help & Support"].map((link) => (
              <a key={link} href="#" style={{
                fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 14, fontWeight: 600,
                color: "#02060c", textDecoration: "none",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {link}
              </a>
            ))}
          </div>
          <p style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 13, color: "rgba(2,6,12,0.45)" }}>
            © {new Date().getFullYear()} UniSalon Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
