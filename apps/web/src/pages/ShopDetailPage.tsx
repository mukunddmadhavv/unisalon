import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
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
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const { data: shop, isLoading, error } = useQuery<ShopDetail>({
    queryKey: ["shop-detail", slug],
    queryFn: () => api.getShopBySlug(slug!),
    enabled: !!slug,
  });

  const serviceIdsQueryParam = selectedServices.join(",");
  const { data: slots = [], isFetching: isSlotsLoading } = useQuery<string[]>({
    queryKey: ["shop-slots", shop?.id, selectedDate, serviceIdsQueryParam, selectedStaff],
    queryFn: async () => {
      const res = await api.getShopSlots(shop!.id, { date: selectedDate, serviceIds: serviceIdsQueryParam });
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-border-light border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-white border border-border-light rounded-2xl p-10 max-w-sm text-center shadow-md">
          <p className="font-bold text-xl text-primary mb-2">Salon Not Found</p>
          <p className="text-text-secondary text-sm mb-6">This salon does not exist or has been suspended.</p>
          <Link to="/" className="btn-primary w-full justify-center">
            ← Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  const totalCost = shop.services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);
  const totalDuration = shop.services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.durationMins, 0);

  // Group services by category
  const categoriesList = ["ALL", ...Array.from(new Set(shop.services.map((s) => s.category)))];

  const filteredServices =
    activeCategory === "ALL"
      ? shop.services
      : shop.services.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-white pb-28 font-body-md text-text-primary">
      
      {/* ── TOP NAV BAR ── */}
      <header className="sticky top-0 z-50 bg-white px-5 py-4 flex items-center justify-between border-b border-border-light max-w-4xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center hover:opacity-85">
          <span className="material-symbols-outlined text-primary text-[24px]">arrow_back</span>
        </button>
        <span className="font-display font-black text-lg tracking-tight text-primary">Partner Salon Menu</span>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-primary cursor-pointer hover:scale-105 transition-transform">favorite</span>
          <span className="material-symbols-outlined text-primary cursor-pointer hover:scale-105 transition-transform">share</span>
        </div>
      </header>

      {/* ── MAIN LAYOUT CONTAINER ── */}
      <main className="max-w-4xl mx-auto mt-4 px-5">
        
        {/* Salon Header Card (Swiggy Style) */}
        <section className="bg-white p-5 rounded-xl swiggy-shadow border border-border-light">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="font-headline-lg text-2xl font-black text-primary mb-1.5">{shop.name}</h1>
              <p className="text-xs text-text-secondary font-medium mb-3">
                {shop.address}, {shop.city}, {shop.district}
              </p>
            </div>
            <span className="inline-flex items-center gap-0.5 bg-rating-green text-white font-bold text-xs px-2 py-1 rounded">
              {shop.rating.toFixed(1)} <span className="material-symbols-outlined !text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </span>
          </div>

          <div className="dashed-divider my-3"></div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-lg">schedule</span>
              <span className="text-xs font-bold text-primary">{shop.openTime} – {shop.closeTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-lg">currency_rupee</span>
              <span className="text-xs font-bold text-primary uppercase tracking-wide">{shop.category} Menu</span>
            </div>
          </div>
        </section>

        {/* Category Tabs (Horizontal Scroll) */}
        <section className="mt-6 border-b border-border-light">
          <div className="flex overflow-x-auto no-scrollbar gap-6 pb-2.5">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap text-sm font-bold pb-1 transition-all ${
                  activeCategory === cat
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                {cat === "ALL" ? "All Services" : cat.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </section>

        {/* ── MENUS & TIME SLOT CHOOSER (GRID LAYOUT) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          
          {/* Services Menu (Left Column) */}
          <div className="lg:col-span-7 flex flex-col gap-1">
            <h2 className="font-headline-md text-base text-text-primary mb-2">
              {activeCategory === "ALL" ? "Menu Items" : activeCategory.replace(/_/g, " ")} ({filteredServices.length})
            </h2>

            {filteredServices.map((svc) => {
              const isSelected = selectedServices.includes(svc.id);
              return (
                <div
                  key={svc.id}
                  className="py-6 border-b border-border-light flex gap-4 items-start justify-between bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="material-symbols-outlined text-rating-green text-sm">stars</span>
                      <span className="text-[9px] text-offer-text font-black uppercase tracking-wider">Bestseller</span>
                    </div>
                    <h3 className="text-sm font-bold text-primary mb-1 truncate">{svc.name}</h3>
                    <p className="text-sm font-black text-primary mb-2">₹{(svc.price / 100).toFixed(0)}</p>
                    {svc.description && (
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 pr-2">
                        {svc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2.5 text-text-secondary text-[11px] font-bold">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{svc.durationMins} mins</span>
                    </div>
                  </div>

                  {/* Add Image/Button block */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <div className="w-full h-full bg-surface-container rounded-xl overflow-hidden border border-border-light">
                      <img
                        className="w-full h-full object-cover"
                        alt={svc.name}
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgFHRy78LcO4So8cu4g0Gfcvk-Vk9vRBtwKCo_iRKIlzKqrdhnRWyF2aI1du-I2OWPvRl9BPjcYOBefYbBceBH9DYHU-oYz58A8FAvFW1gLFYzYJsDaOPJomH9P1ACxzyzPjaimnax2ZEOkx869HyF8qOAr8pNskCDI16XF86Sc8dlMM-N-zd2D5LD-sgM-AmPn5cy90Ng0-xooC6x3WQClYPiVvCa6njnQLNKXJgdtHQ0KicwirXyMnU4w9D37Ts54_PxQMjgvoBI"
                      />
                    </div>
                    <button
                      onClick={() => toggleService(svc.id)}
                      className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 font-bold text-xs px-6 py-1.5 rounded-lg swiggy-shadow border transition-all active:scale-95 duration-100 ${
                        isSelected
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-rating-green border-border-light hover:border-rating-green"
                      }`}
                    >
                      {isSelected ? "REMOVE" : "ADD"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Date & Time Selector Sidebar (Right Column) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-border-light rounded-xl p-5 swiggy-shadow sticky top-24 space-y-5">
              
              {/* Stylist Selector */}
              {shop.staff.length > 0 && (
                <div>
                  <h3 className="font-headline-md text-sm text-text-primary mb-3">Choose Stylist (Optional)</h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {/* Any Stylist */}
                    <button
                      onClick={() => setSelectedStaff(null)}
                      className={`flex flex-col items-center justify-center shrink-0 w-16 py-3 rounded-lg border text-center transition-all ${
                        selectedStaff === null
                          ? "border-primary bg-primary/5 font-bold"
                          : "border-border-light bg-white hover:border-primary"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm mb-1.5">
                        ★
                      </div>
                      <span className="text-[10px] text-primary truncate max-w-full">Any</span>
                    </button>

                    {shop.staff.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedStaff(member.id)}
                        className={`flex flex-col items-center justify-center shrink-0 w-16 py-3 rounded-lg border text-center transition-all ${
                          selectedStaff === member.id
                            ? "border-primary bg-primary/5 font-bold"
                            : "border-border-light bg-white hover:border-primary"
                        }`}
                      >
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover mb-1.5 border border-border-light"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs font-bold mb-1.5">
                            {member.name[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-[10px] text-primary truncate max-w-full px-1">{member.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date selection carousel */}
              <div>
                <h3 className="font-headline-md text-sm text-text-primary mb-3">Select Date</h3>
                <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1">
                  {dateOptions.map((opt, i) => (
                    <button
                      key={opt.dateStr}
                      onClick={() => handleDateSelect(i, opt.dateStr)}
                      className={`flex flex-col items-center justify-center shrink-0 w-12 py-2.5 rounded-lg border text-center transition-all ${
                        activeDateIndex === i
                          ? "border-primary bg-primary text-white font-bold"
                          : "border-border-light bg-white hover:border-primary"
                      }`}
                    >
                      <span className={`text-[9px] uppercase font-semibold ${activeDateIndex === i ? "text-white/80" : "text-text-secondary"}`}>
                        {opt.label}
                      </span>
                      <span className={`text-sm font-bold mt-0.5 ${activeDateIndex === i ? "text-white" : "text-primary"}`}>
                        {opt.dayNum}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots selection */}
              <div>
                <h3 className="font-headline-md text-sm text-text-primary mb-3">Available Slots</h3>
                {selectedServices.length === 0 ? (
                  <div className="border border-dashed border-outline-variant rounded-lg p-6 text-center text-xs text-text-secondary/70">
                    Add a service to view slot availability.
                  </div>
                ) : isSlotsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-border-light border-t-primary rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="border border-dashed border-outline-variant rounded-lg p-6 text-center text-xs text-text-secondary/70">
                    No slots available on this date. Try another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((timeStr) => (
                      <button
                        key={timeStr}
                        onClick={() => holdMutation.mutate({ startTime: timeStr })}
                        disabled={holdMutation.isPending}
                        className="py-2.5 px-1 border border-border-light rounded-lg font-body-sm text-[11px] font-bold text-center bg-surface-container-low hover:border-primary transition-colors disabled:opacity-40"
                      >
                        {timeStr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── STICKY BOTTOM CHECKOUT TRIGGER BAR ── */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-light p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:px-16">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-text-secondary font-bold">
                {selectedServices.length} Service{selectedServices.length > 1 ? "s" : ""} · {totalDuration} mins
              </span>
              <span className="font-headline-md text-lg font-black text-primary mt-0.5">
                ₹{(totalCost / 100).toFixed(0)}
              </span>
            </div>
            <span className="text-xs font-bold text-text-secondary/85 animate-pulse hidden sm:inline">
              Select an available slot above to secure appointment &rarr;
            </span>
            <span className="text-xs font-bold text-text-secondary/85 animate-pulse sm:hidden">
              Select time slot to book &rarr;
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
