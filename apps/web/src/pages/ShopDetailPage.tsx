import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Clock, IndianRupee, Star, CheckCircle2, MapPin, Scissors } from "lucide-react";
import { format, addDays } from "date-fns";
import toast from "react-hot-toast";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  category: string;
  description?: string;
}

interface StaffMember {
  id: string;
  name: string;
  photoUrl?: string;
  specialization?: string;
  experience?: string;
}

interface ShopDetail {
  id: string;
  name: string;
  category: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  openTime: string;
  closeTime: string;
  rating: number;
  totalReviews: number;
  coverImage?: string;
  services: Service[];
  staff: StaffMember[];
}

export default function ShopDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [activeDateIndex, setActiveDateIndex] = useState(0);

  const { data: shop, isLoading, error } = useQuery<ShopDetail>({
    queryKey: ["shop-detail", slug],
    queryFn: () => api.getShopBySlug(slug!),
    enabled: !!slug,
  });

  const serviceIdsQueryParam = selectedServices.join(",");
  const { data: slots = [], isFetching: isSlotsLoading } = useQuery<string[]>({
    queryKey: ["shop-slots", shop?.id, selectedDate, serviceIdsQueryParam, selectedStaff],
    queryFn: async () => {
      const res = await api.getShopSlots(shop!.id, {
        date: selectedDate,
        serviceIds: serviceIdsQueryParam,
      });
      const availableSlots = res.filter((s: any) => {
        if (!s.available) return false;
        if (selectedStaff && s.staffId !== selectedStaff) return false;
        return true;
      });
      const uniqueTimes = Array.from(new Set(availableSlots.map((s: any) => s.startTime))) as string[];
      return uniqueTimes.sort();
    },
    enabled: !!shop?.id && selectedServices.length > 0 && !!selectedDate,
  });

  const holdMutation = useMutation({
    mutationFn: (data: { startTime: string }) =>
      api.createSlotHold({
        shopId: shop!.id,
        staffId: selectedStaff || undefined,
        date: selectedDate,
        startTime: data.startTime,
        serviceIds: selectedServices,
      }),
    onSuccess: (data) => {
      localStorage.setItem("unisalon-active-hold-id", data.id);
      localStorage.setItem("unisalon-active-hold-expires", String(new Date(data.expiresAt).getTime()));
      toast.success("Slot locked for 90 seconds! Complete your booking.");
      navigate("/booking/confirm");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to hold slot.");
    },
  });

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const dateOptions = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(new Date(), i);
    return { dateStr: format(d, "yyyy-MM-dd"), label: format(d, "EEE"), dayNum: format(d, "d") };
  });

  const handleDateSelect = (index: number, dateStr: string) => {
    setActiveDateIndex(index);
    setSelectedDate(dateStr);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e4ebf3", borderTopColor: "#111111", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 48, maxWidth: 400, textAlign: "center" }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: "#02060c", marginBottom: 8 }}>Salon Not Found</p>
          <p style={{ fontSize: 14, color: "rgba(2,6,12,0.5)", marginBottom: 24 }}>
            This salon does not exist or has been suspended.
          </p>
          <Link to="/" className="btn-primary">← Back to Discovery</Link>
        </div>
      </div>
    );
  }

  const totalCost = shop.services.filter((s) => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
  const totalDuration = shop.services.filter((s) => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.durationMins, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Montserrat', Arial, sans-serif", paddingBottom: selectedServices.length > 0 ? 100 : 0 }}>

      {/* Cover Image */}
      <div style={{ height: 320, position: "relative", background: "#f5f7fa", overflow: "hidden" }}>
        {shop.coverImage ? (
          <img src={shop.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🏪</div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #ffffff 0%, transparent 60%)" }} />
        {/* Back button */}
        <Link to="/" style={{
          position: "absolute", top: 24, left: 24, textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.92)", border: "1px solid #e4ebf3",
          borderRadius: 100, padding: "8px 16px",
          fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 13, fontWeight: 700, color: "#02060c",
          backdropFilter: "blur(8px)",
        }}>
          <Scissors size={14} /> UniSalon
        </Link>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 30px" }}>
        {/* Shop Info Card */}
        <div style={{
          background: "#ffffff", border: "1px solid #e4ebf3", borderRadius: 24,
          padding: "28px 32px", marginTop: -80, position: "relative", zIndex: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: "#02060c", letterSpacing: "-0.5px" }}>{shop.name}</h1>
                <span className="tag tag-dark">{shop.category}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(2,6,12,0.5)", fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                <MapPin size={13} />
                {shop.address}, {shop.city}, {shop.district}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "#fef9e7", border: "1px solid #fde68a", borderRadius: 100, padding: "5px 12px",
                }}>
                  <Star size={13} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#92400e" }}>{shop.rating.toFixed(1)}</span>
                </div>
                <span style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", fontWeight: 600 }}>{shop.totalReviews} reviews</span>
                <span style={{ fontSize: 13, color: "rgba(2,6,12,0.45)" }}>·</span>
                <span style={{ fontSize: 13, color: "rgba(2,6,12,0.55)", fontWeight: 600 }}>
                  🕐 {shop.openTime} – {shop.closeTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, marginTop: 24 }}>

          {/* Left: Services + Staff */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Services */}
            <div style={{ background: "#ffffff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#02060c", marginBottom: 20 }}>Select Services</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {shop.services.map((svc, idx) => {
                  const isSelected = selectedServices.includes(svc.id);
                  return (
                    <div
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 16,
                        padding: "18px 0",
                        borderTop: idx === 0 ? "none" : "1px solid #f0f0f0",
                        cursor: "pointer",
                        borderRadius: 4,
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isSelected ? "#111111" : "#ffffff",
                        border: isSelected ? "2px solid #111111" : "2px solid #d0d0d0",
                        transition: "all 0.15s ease",
                      }}>
                        {isSelected && <CheckCircle2 size={13} color="#ffffff" fill="#ffffff" />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h4 style={{ fontWeight: 700, fontSize: 15, color: isSelected ? "#111111" : "#02060c" }}>{svc.name}</h4>
                          <div style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 800, fontSize: 15, color: "#02060c" }}>
                            <IndianRupee size={13} />
                            {(svc.price / 100).toFixed(0)}
                          </div>
                        </div>
                        {svc.description && (
                          <p style={{ fontSize: 13, color: "rgba(2,6,12,0.5)", marginTop: 4, lineHeight: 1.5 }}>{svc.description}</p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: "rgba(2,6,12,0.4)", fontSize: 12, fontWeight: 600 }}>
                          <Clock size={11} /> {svc.durationMins} mins
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Staff */}
            {shop.staff.length > 0 && (
              <div style={{ background: "#ffffff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#02060c", marginBottom: 20 }}>Choose Stylist <span style={{ fontWeight: 500, fontSize: 14, color: "rgba(2,6,12,0.4)" }}>(optional)</span></h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
                  {/* Any */}
                  <div
                    onClick={() => setSelectedStaff(null)}
                    style={{
                      background: selectedStaff === null ? "#111111" : "#f5f7fa",
                      border: "1px solid",
                      borderColor: selectedStaff === null ? "#111111" : "#e4ebf3",
                      borderRadius: 16, padding: "16px 12px", textAlign: "center", cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: selectedStaff === null ? "rgba(255,255,255,0.15)" : "#e4ebf3",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 8px", fontSize: 18,
                    }}>⭐</div>
                    <p style={{ fontWeight: 700, fontSize: 12, color: selectedStaff === null ? "#ffffff" : "#02060c" }}>Any Available</p>
                    <p style={{ fontSize: 11, color: selectedStaff === null ? "rgba(255,255,255,0.6)" : "rgba(2,6,12,0.4)", marginTop: 2 }}>Quickest</p>
                  </div>

                  {shop.staff.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaff(member.id)}
                      style={{
                        background: selectedStaff === member.id ? "#111111" : "#f5f7fa",
                        border: "1px solid",
                        borderColor: selectedStaff === member.id ? "#111111" : "#e4ebf3",
                        borderRadius: 16, padding: "16px 12px", textAlign: "center", cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", margin: "0 auto 8px", display: "block" }} />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%", margin: "0 auto 8px",
                          background: selectedStaff === member.id ? "rgba(255,255,255,0.15)" : "#e4ebf3",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: 14, color: selectedStaff === member.id ? "#fff" : "#02060c",
                        }}>
                          {member.name[0].toUpperCase()}
                        </div>
                      )}
                      <p style={{ fontWeight: 700, fontSize: 12, color: selectedStaff === member.id ? "#ffffff" : "#02060c" }}>{member.name}</p>
                      {member.specialization && (
                        <p style={{ fontSize: 11, color: selectedStaff === member.id ? "rgba(255,255,255,0.6)" : "rgba(2,6,12,0.4)", marginTop: 2 }}>{member.specialization}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Date & Slots */}
          <div>
            <div style={{
              background: "#ffffff", border: "1px solid #e4ebf3", borderRadius: 24, padding: 24,
              position: "sticky", top: 24,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#02060c", marginBottom: 20 }}>Date & Time Slot</h3>

              {/* Date picker */}
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
                {dateOptions.map((opt, i) => (
                  <button
                    key={opt.dateStr}
                    onClick={() => handleDateSelect(i, opt.dateStr)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      padding: "10px 12px", borderRadius: 12, minWidth: 52, border: "1.5px solid",
                      background: activeDateIndex === i ? "#111111" : "#ffffff",
                      borderColor: activeDateIndex === i ? "#111111" : "#e4ebf3",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: activeDateIndex === i ? "rgba(255,255,255,0.7)" : "rgba(2,6,12,0.4)" }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: activeDateIndex === i ? "#ffffff" : "#02060c", marginTop: 2 }}>
                      {opt.dayNum}
                    </span>
                  </button>
                ))}
              </div>

              {/* Slots */}
              {selectedServices.length === 0 ? (
                <div style={{
                  border: "1.5px dashed #e4ebf3", borderRadius: 16, padding: "24px 16px",
                  textAlign: "center", color: "rgba(2,6,12,0.4)", fontSize: 13, fontWeight: 600,
                }}>
                  Select a service to see available slots.
                </div>
              ) : isSlotsLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
                  <div style={{ width: 24, height: 24, border: "2px solid #e4ebf3", borderTopColor: "#111", borderRadius: "50%" }} />
                </div>
              ) : slots.length === 0 ? (
                <div style={{
                  border: "1.5px dashed #e4ebf3", borderRadius: 16, padding: "24px 16px",
                  textAlign: "center", color: "rgba(2,6,12,0.4)", fontSize: 13, fontWeight: 600,
                }}>
                  No slots for this date. Try another day.
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(2,6,12,0.4)", marginBottom: 12 }}>
                    Available Slots
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {slots.map((timeStr) => (
                      <button
                        key={timeStr}
                        onClick={() => holdMutation.mutate({ startTime: timeStr })}
                        disabled={holdMutation.isPending}
                        style={{
                          background: "#f5f7fa", border: "1.5px solid #e4ebf3",
                          borderRadius: 10, padding: "10px 4px", cursor: "pointer",
                          fontFamily: "'Montserrat', Arial, sans-serif",
                          fontSize: 12, fontWeight: 700, color: "#02060c",
                          transition: "all 0.15s ease", opacity: holdMutation.isPending ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#111111";
                          (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#111111";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#f5f7fa";
                          (e.currentTarget as HTMLButtonElement).style.color = "#02060c";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#e4ebf3";
                        }}
                      >
                        {timeStr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom sticky bar */}
      {selectedServices.length > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(255,255,255,0.95)", borderTop: "1px solid #e4ebf3",
          padding: "16px 30px", backdropFilter: "blur(8px)", zIndex: 40,
        }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", fontWeight: 600 }}>
                {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} · {totalDuration} mins
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <IndianRupee size={16} style={{ color: "#02060c" }} />
                <span style={{ fontWeight: 900, fontSize: 22, color: "#02060c" }}>{(totalCost / 100).toFixed(0)}</span>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(2,6,12,0.4)" }}>
              Select a time slot above to book →
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
