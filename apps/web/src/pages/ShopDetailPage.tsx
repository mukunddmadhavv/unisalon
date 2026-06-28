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
  images?: string[];
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
  const [searchQuery, setSearchQuery] = useState("");

  // Carousel & Touch Swipe States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  const searchedServices = filteredServices.filter((svc) =>
    svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    svc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gallery = shop.images?.filter((img) => img && img.trim() !== "") ?? [];
  const slides = gallery.length > 0 ? gallery : (shop.coverImage ? [shop.coverImage] : []);

  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setActiveImageIndex((prev) => (prev + 1) % slides.length);
    } else if (isRightSwipe) {
      setActiveImageIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-28 font-body-md text-text-primary">
      
      {/* ── TOP NAV BAR ── */}
      <header className="sticky top-0 z-50 bg-white px-4 py-4 flex items-center justify-between border-b border-border-light">
        <button onClick={() => window.history.back()} className="flex items-center">
          <span className="material-symbols-outlined text-text-primary">arrow_back</span>
        </button>
        <span className="font-display font-black text-sm uppercase tracking-wider text-primary">Salon Menu &amp; Booking</span>
        <div className="flex gap-4">
          <button onClick={() => toast.success("Added to favorites!")}>
            <span className="material-symbols-outlined text-text-primary">favorite</span>
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
          }}>
            <span className="material-symbols-outlined text-text-primary">share</span>
          </button>
        </div>
      </header>

      {/* Hero Section Carousel */}
      {slides.length > 0 && (
        <section className="relative w-full aspect-[16/9] md:max-h-[400px] overflow-hidden bg-black">
          <div 
            className="w-full h-full relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div 
              className="flex w-full h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
            >
              {slides.map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center bg-black">
                  <img
                    src={img}
                    alt={`${shop.name} ${idx + 1}`}
                    className="max-w-full max-h-full object-contain select-none"
                  />
                </div>
              ))}
            </div>

            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-primary flex items-center justify-center shadow-md transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined font-bold text-sm">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % slides.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-primary flex items-center justify-center shadow-md transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined font-bold text-sm">chevron_right</span>
                </button>
              </>
            )}

            {/* Position Indicators (Dots) */}
            {slides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      activeImageIndex === idx ? "bg-white w-4" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Image counter tag */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
              {activeImageIndex + 1} / {slides.length} Photos
            </div>
          </div>
        </section>
      )}

      {/* Salon Header Card (Swiggy Style) */}
      <section className="px-4 sm:px-6 lg:px-8 mt-4">
        <div className="p-4 rounded-xl swiggy-shadow border border-border-light bg-white max-w-6xl mx-auto">
          <h1 className="font-headline-lg text-xl md:text-2xl text-text-primary mb-1">{shop.name}</h1>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-rating-green text-white rounded flex items-center px-1.5 py-0.5 gap-0.5">
              <span className="text-[10px] font-bold">{shop.rating.toFixed(1)}</span>
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <span className="text-xs text-text-secondary font-semibold">({shop.totalReviews}+ ratings)</span>
          </div>
          <div className="text-xs text-text-secondary font-medium mb-3">
            {shop.address}, {shop.city}, {shop.district}
          </div>
          <div className="dashed-divider mb-3"></div>
          <div className="flex items-center gap-6 text-xs text-text-primary font-bold">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-text-primary text-base">schedule</span>
              <span>Open: {shop.openTime} - {shop.closeTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-text-primary text-base">content_cut</span>
              <span className="uppercase tracking-wide">{shop.category.replace(/_/g, " ")} Salon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 sm:px-6 lg:px-8 mt-6 max-w-6xl mx-auto">
        <div className="relative">
          <input 
            className="w-full bg-[#f6f3f3] border-none rounded-lg py-3 pl-10 pr-4 text-xs font-semibold focus:ring-0 placeholder:text-[#686B78]" 
            placeholder="Search for services..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg">search</span>
        </div>
      </section>

      {/* Category Tabs (Quick Scroll) */}
      <section className="mt-6 border-b border-border-light max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto no-scrollbar gap-6 pb-3">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap text-xs font-bold pb-1 transition-all ${
                activeCategory === cat
                  ? "text-text-primary border-b-2 border-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              {cat === "ALL" ? "Trending Now" : cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </section>

      {/* Main Layout Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Services Menu (Left Column) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-bold text-text-primary px-1">
              {activeCategory === "ALL" ? "Trending Now" : activeCategory.replace(/_/g, " ")} ({searchedServices.length})
            </h2>

            <div className="divide-y divide-border-light bg-white rounded-xl overflow-hidden px-2">
              {searchedServices.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-secondary">
                  No matching services found.
                </div>
              ) : (
                searchedServices.map((svc) => {
                  const isSelected = selectedServices.includes(svc.id);
                  return (
                    <div key={svc.id} className="py-6 border-b border-border-light flex gap-4 first:pt-4 last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-rating-green text-sm star-filled" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                          <span className="text-[9px] text-offer-text font-black tracking-wider uppercase">Bestseller</span>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary mb-1">{svc.name}</h3>
                        <p className="text-xs font-black text-text-primary mb-1.5">₹{(svc.price / 100).toFixed(0)}</p>
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-2">
                          {svc.description || "Premium customized beauty and styling service designed for optimal results."}
                        </p>
                        <div className="flex items-center gap-1.5 text-text-secondary text-[10px] font-bold">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span>{svc.durationMins} mins</span>
                        </div>
                      </div>

                      {/* Add Image & Button block */}
                      <div className="relative w-28 md:w-32 aspect-[16/9] flex-shrink-0">
                        <img
                          className="w-full h-full object-cover rounded-xl border border-gray-100"
                          alt={svc.name}
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgFHRy78LcO4So8cu4g0Gfcvk-Vk9vRBtwKCo_iRKIlzKqrdhnRWyF2aI1du-I2OWPvRl9BPjcYOBefYbBceBH9DYHU-oYz58A8FAvFW1gLFYzYJsDaOPJomH9P1ACxzyzPjaimnax2ZEOkx869HyF8qOAr8pNskCDI16XF86Sc8dlMM-N-zd2D5LD-sgM-AmPn5cy90Ng0-xooC6x3WQClYPiVvCa6njnQLNKXJgdtHQ0KicwirXyMnU4w9D37Ts54_PxQMjgvoBI"
                        />
                        <button
                          onClick={() => toggleService(svc.id)}
                          className={`absolute -bottom-3 left-1/2 -translate-x-1/2 font-bold text-[10px] px-6 py-1.5 rounded-lg swiggy-shadow border transition-transform active:scale-95 ${
                            isSelected
                              ? "bg-[#1C893B] text-white border-[#1C893B]"
                              : "bg-white text-[#1C893B] border-border-light"
                          }`}
                        >
                          {isSelected ? "ADDED" : "ADD"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Date & Time Selector Sidebar (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Booking Summary Widget */}
            {selectedServices.length > 0 && (
              <div className="bg-white border border-border-light rounded-xl p-5 swiggy-shadow space-y-4">
                <h5 className="font-sans text-xs uppercase tracking-widest text-text-primary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  Selected Services
                </h5>
                <div className="space-y-3 divide-y divide-border-light max-h-48 overflow-y-auto pr-1">
                  {shop.services
                    .filter((s) => selectedServices.includes(s.id))
                    .map((svc) => (
                      <div key={svc.id} className="flex justify-between items-start pt-2 first:pt-0 text-xs">
                        <div>
                          <p className="font-bold text-text-primary">{svc.name}</p>
                          <p className="text-[10px] text-text-secondary">{svc.durationMins} mins</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-text-primary">₹{(svc.price / 100).toFixed(0)}</p>
                          <button
                            onClick={() => toggleService(svc.id)}
                            className="text-[10px] font-bold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="dashed-divider my-2"></div>
                <div className="flex justify-between items-center text-xs font-bold text-text-primary">
                  <span>Subtotal</span>
                  <span>₹{(totalCost / 100).toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Selector Card */}
            <div className="bg-white border border-border-light rounded-xl p-5 swiggy-shadow sticky top-24 space-y-6">
              
              {/* Stylist Selector */}
              {shop.staff.length > 0 && (
                <div>
                  <h3 className="font-sans text-xs uppercase tracking-widest text-text-primary font-bold mb-3">Choose Stylist (Optional)</h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {/* Any Stylist */}
                    <button
                      onClick={() => setSelectedStaff(null)}
                      className={`flex flex-col items-center justify-center shrink-0 w-16 py-3 rounded-xl border text-center transition-all ${
                        selectedStaff === null
                          ? "border-primary bg-primary/5 font-bold"
                          : "border-border-light bg-white hover:border-primary"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mb-1.5">
                        ★
                      </div>
                      <span className="text-[9px] font-bold text-primary truncate max-w-full">Any</span>
                    </button>

                    {shop.staff.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedStaff(member.id)}
                        className={`flex flex-col items-center justify-center shrink-0 w-16 py-3 rounded-xl border text-center transition-all ${
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
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary text-[10px] font-bold mb-1.5">
                            {member.name[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-[9px] font-bold text-primary truncate max-w-full px-1">{member.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date selection carousel */}
              <div>
                <h3 className="font-sans text-xs uppercase tracking-widest text-text-primary font-bold mb-3">Select Date</h3>
                <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1">
                  {dateOptions.map((opt, i) => (
                    <button
                      key={opt.dateStr}
                      onClick={() => handleDateSelect(i, opt.dateStr)}
                      className={`flex flex-col items-center justify-center shrink-0 w-12 py-2.5 rounded-lg border text-center transition-all ${
                        activeDateIndex === i
                          ? "border-primary bg-primary text-white font-bold shadow-sm"
                          : "border-border-light bg-white hover:border-primary"
                      }`}
                    >
                      <span className={`text-[8px] uppercase font-semibold tracking-wider ${activeDateIndex === i ? "text-white/85" : "text-text-secondary"}`}>
                        {opt.label}
                      </span>
                      <span className={`text-xs font-black mt-0.5 ${activeDateIndex === i ? "text-white" : "text-primary"}`}>
                        {opt.dayNum}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots selection */}
              <div>
                <h3 className="font-sans text-xs uppercase tracking-widest text-text-primary font-bold mb-3">Available Slots</h3>
                {selectedServices.length === 0 ? (
                  <div className="border border-dashed border-outline-variant rounded-xl p-6 text-center text-xs text-text-secondary/70">
                    Add a service to view slot availability.
                  </div>
                ) : isSlotsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-border-light border-t-primary rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="border border-dashed border-outline-variant rounded-xl p-6 text-center text-xs text-text-secondary/70">
                    No slots available on this date. Try another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((timeStr) => (
                      <button
                        key={timeStr}
                        onClick={() => holdMutation.mutate({ startTime: timeStr })}
                        disabled={holdMutation.isPending}
                        className="py-2 px-1 border border-border-light rounded-lg font-body-sm text-[11px] font-bold text-center bg-surface-container-low hover:border-primary transition-colors disabled:opacity-40"
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

      {/* Sticky Bottom Trigger Bar */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-light p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:px-16">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-text-secondary font-bold">
                {selectedServices.length} Service{selectedServices.length > 1 ? "s" : ""} · {totalDuration} mins
              </span>
              <span className="font-headline-lg text-lg font-black text-primary mt-0.5">
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
