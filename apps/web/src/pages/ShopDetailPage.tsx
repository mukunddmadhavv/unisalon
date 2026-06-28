import { useState, useEffect } from "react";
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

  // Carousel & Touch Swipe States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className="min-h-screen bg-[#faf9f7] pb-28 font-body-md text-[#1a1c1b]">
      
      {/* ── TOP NAV BAR ── */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isHeaderScrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E5D3C2]/20" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex justify-between items-center w-full">
          <button 
            onClick={() => window.history.back()} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[#170f0a]">arrow_back</span>
          </button>
          {isHeaderScrolled && (
            <span className="font-display font-black text-xs uppercase tracking-wider text-[#170f0a] truncate max-w-[50%]">
              {shop.name}
            </span>
          )}
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: shop.name, text: shop.description, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[#170f0a] text-lg">share</span>
            </button>
            <button 
              onClick={() => toast.success("Added to favorites!")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[#170f0a] text-lg">favorite</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section Carousel */}
      <section className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden bg-gray-150">
        {slides.length > 0 ? (
          <div 
            className="w-full h-full relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Slide Track */}
            <div 
              className="flex w-full h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
            >
              {slides.map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0">
                  <img
                    src={img}
                    alt={`${shop.name} interior ${idx + 1}`}
                    className="w-full h-full object-cover select-none"
                  />
                </div>
              ))}
            </div>

            {/* Carousel Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#170f0a] flex items-center justify-center shadow-md transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined font-bold">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % slides.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#170f0a] flex items-center justify-center shadow-md transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined font-bold">chevron_right</span>
                </button>
              </>
            )}

            {/* Position Indicators (Dots) */}
            {slides.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      activeImageIndex === idx ? "bg-white w-6" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Image counter tag */}
            <div className="absolute bottom-16 right-4 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              {activeImageIndex + 1} / {slides.length} Photos
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
            No Images Available
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf9f7] via-transparent to-transparent pointer-events-none"></div>
      </section>

      {/* Floating Content Section */}
      <div className="relative -mt-12 px-4 sm:px-8 max-w-6xl mx-auto z-10">
        
        {/* Salon Header Card */}
        <section className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#E5D3C2]/15">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-[#E5D3C2]/20">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="bg-[#725a41] text-white text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-sm uppercase">TOP RATED</span>
                <span className="text-[#6B7280] text-xs font-semibold">{shop.city}, {shop.district}</span>
              </div>
              <h1 className="font-sans text-2xl md:text-3xl font-extrabold text-[#1A1410] mb-1.5">{shop.name}</h1>
              <div className="flex items-center gap-1 text-[#725a41]">
                <span className="material-symbols-outlined text-sm star-filled" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-bold text-sm">{shop.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-xs ml-1">({shop.totalReviews} Reviews)</span>
              </div>
              {shop.description && (
                <p className="text-xs text-[#4e4540] mt-3 leading-relaxed max-w-2xl">{shop.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2 font-medium">{shop.address}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 shrink-0">
              <button 
                onClick={() => {
                  toast.success(`Calling ${shop.name}...`);
                  window.location.href = `tel:${shop.staff[0]?.id || "9999999999"}`; // Fallback placeholder or custom phone
                }}
                className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full border border-[#E5D3C2] flex items-center justify-center text-[#170f0a] hover:bg-gray-50 transition-colors">
                  <span className="material-symbols-outlined text-lg">call</span>
                </div>
                <span className="text-[10px] font-bold text-[#4e4540] tracking-wider">CALL</span>
              </button>
              <button 
                onClick={() => {
                  const query = encodeURIComponent(`${shop.name}, ${shop.address}, ${shop.city}`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                }}
                className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full border border-[#E5D3C2] flex items-center justify-center text-[#170f0a] hover:bg-gray-50 transition-colors">
                  <span className="material-symbols-outlined text-lg">directions</span>
                </div>
                <span className="text-[10px] font-bold text-[#4e4540] tracking-wider">DIRECTIONS</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-4 text-xs font-bold text-[#4e4540]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#725a41] text-lg">schedule</span>
              <span>Open: {shop.openTime} – {shop.closeTime}</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#725a41] text-lg">content_cut</span>
              <span className="uppercase tracking-wide">{shop.category.replace(/_/g, " ")} Salon</span>
            </div>
          </div>
        </section>

        {/* Sticky Service Categories */}
        <nav className="mt-8 mb-6 sticky top-16 bg-[#faf9f7]/95 backdrop-blur-sm z-40 py-3 border-b border-[#E5D3C2]/20 overflow-x-auto no-scrollbar flex gap-8 whitespace-nowrap">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap text-xs uppercase tracking-widest font-bold pb-2 transition-all relative ${
                activeCategory === cat
                  ? "text-[#170f0a] border-b-2 border-[#170f0a]"
                  : "text-[#6B7280] hover:text-[#170f0a]"
              }`}
            >
              {cat === "ALL" ? "All Services" : cat.replace(/_/g, " ")}
            </button>
          ))}
        </nav>

        {/* Services & Time/Slot Selector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Services Menu (Left Column) */}
          <div className="lg:col-span-7 flex flex-col gap-1">
            <h2 className="font-sans text-lg font-bold text-[#1a1c1b] mb-4">
              {activeCategory === "ALL" ? "Menu Items" : activeCategory.replace(/_/g, " ")} ({filteredServices.length})
            </h2>

            <div className="space-y-6">
              {filteredServices.map((svc) => {
                const isSelected = selectedServices.includes(svc.id);
                return (
                  <div
                    key={svc.id}
                    className="p-5 border border-[#E5D3C2]/15 rounded-xl flex gap-4 items-start justify-between bg-white hover:shadow-md transition-shadow group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="material-symbols-outlined text-[#725a41] text-sm star-filled" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                        <span className="text-[9px] text-[#725a41] font-black uppercase tracking-wider">Bestseller</span>
                      </div>
                      <h3 className="text-base font-bold text-[#170f0a] mb-1.5">{svc.name}</h3>
                      <p className="text-[#6B7280] text-xs leading-relaxed mb-3 line-clamp-2">
                        {svc.description || "Premium customized service designed to fit your unique requirements."}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-[#1A1410] text-sm">₹{(svc.price / 100).toFixed(0)}</span>
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span> {svc.durationMins} mins
                        </span>
                      </div>
                    </div>

                    {/* Add Image & Button block */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img
                        className="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all duration-500 border border-gray-100"
                        alt={svc.name}
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgFHRy78LcO4So8cu4g0Gfcvk-Vk9vRBtwKCo_iRKIlzKqrdhnRWyF2aI1du-I2OWPvRl9BPjcYOBefYbBceBH9DYHU-oYz58A8FAvFW1gLFYzYJsDaOPJomH9P1ACxzyzPjaimnax2ZEOkx869HyF8qOAr8pNskCDI16XF86Sc8dlMM-N-zd2D5LD-sgM-AmPn5cy90Ng0-xooC6x3WQClYPiVvCa6njnQLNKXJgdtHQ0KicwirXyMnU4w9D37Ts54_PxQMjgvoBI"
                      />
                      <button
                        onClick={() => toggleService(svc.id)}
                        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 font-bold text-[9px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg active:scale-90 transition-transform ${
                          isSelected
                            ? "bg-[#725a41] text-white"
                            : "bg-[#170f0a] text-white"
                        }`}
                      >
                        {isSelected ? "REMOVE" : "ADD"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date & Time Selector Sidebar (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Booking Summary Widget */}
            {selectedServices.length > 0 && (
              <div className="bg-white border border-[#E5D3C2]/15 rounded-2xl p-6 shadow-sm space-y-4">
                <h5 className="font-sans text-xs uppercase tracking-widest text-[#170f0a] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  Selected Services
                </h5>
                <div className="space-y-3 divide-y divide-gray-150 max-h-48 overflow-y-auto pr-1">
                  {shop.services
                    .filter((s) => selectedServices.includes(s.id))
                    .map((svc) => (
                      <div key={svc.id} className="flex justify-between items-start pt-2 first:pt-0 text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{svc.name}</p>
                          <p className="text-[10px] text-gray-500">{svc.durationMins} mins</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{(svc.price / 100).toFixed(0)}</p>
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
                <div className="h-px bg-[#E5D3C2]/20 my-2"></div>
                <div className="flex justify-between items-center text-xs font-bold text-[#170f0a]">
                  <span>Subtotal</span>
                  <span>₹{(totalCost / 100).toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Selector Card */}
            <div className="bg-white border border-[#E5D3C2]/15 rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
              
              {/* Stylist Selector */}
              {shop.staff.length > 0 && (
                <div>
                  <h3 className="font-sans text-xs uppercase tracking-widest text-[#170f0a] font-bold mb-3">Choose Stylist (Optional)</h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {/* Any Stylist */}
                    <button
                      onClick={() => setSelectedStaff(null)}
                      className={`flex flex-col items-center justify-center shrink-0 w-16 py-3 rounded-xl border text-center transition-all ${
                        selectedStaff === null
                          ? "border-[#170f0a] bg-[#170f0a]/5 font-bold"
                          : "border-gray-255 bg-white hover:border-[#170f0a]"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#170f0a]/10 flex items-center justify-center text-[#170f0a] text-xs mb-1.5">
                        ★
                      </div>
                      <span className="text-[9px] font-bold text-[#170f0a] truncate max-w-full">Any</span>
                    </button>

                    {shop.staff.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedStaff(member.id)}
                        className={`flex flex-col items-center justify-center shrink-0 w-16 py-3 rounded-xl border text-center transition-all ${
                          selectedStaff === member.id
                            ? "border-[#170f0a] bg-[#170f0a]/5 font-bold"
                            : "border-gray-255 bg-white hover:border-[#170f0a]"
                        }`}
                      >
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover mb-1.5 border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#170f0a] text-[10px] font-bold mb-1.5">
                            {member.name[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-[9px] font-bold text-[#170f0a] truncate max-w-full px-1">{member.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date selection carousel */}
              <div>
                <h3 className="font-sans text-xs uppercase tracking-widest text-[#170f0a] font-bold mb-3">Select Date</h3>
                <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1">
                  {dateOptions.map((opt, i) => (
                    <button
                      key={opt.dateStr}
                      onClick={() => handleDateSelect(i, opt.dateStr)}
                      className={`flex flex-col items-center justify-center shrink-0 w-12 py-2.5 rounded-lg border text-center transition-all ${
                        activeDateIndex === i
                          ? "border-[#170f0a] bg-[#170f0a] text-white font-bold shadow-sm"
                          : "border-gray-255 bg-white hover:border-[#170f0a]"
                      }`}
                    >
                      <span className={`text-[8px] uppercase font-semibold tracking-wider ${activeDateIndex === i ? "text-white/85" : "text-gray-500"}`}>
                        {opt.label}
                      </span>
                      <span className={`text-xs font-black mt-0.5 ${activeDateIndex === i ? "text-white" : "text-[#170f0a]"}`}>
                        {opt.dayNum}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots selection */}
              <div>
                <h3 className="font-sans text-xs uppercase tracking-widest text-[#170f0a] font-bold mb-3">Available Slots</h3>
                {selectedServices.length === 0 ? (
                  <div className="border border-dashed border-[#E5D3C2]/30 rounded-xl p-6 text-center text-xs text-gray-500">
                    Add a service to view slot availability.
                  </div>
                ) : isSlotsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-border-light border-t-primary rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="border border-dashed border-[#E5D3C2]/30 rounded-xl p-6 text-center text-xs text-gray-500">
                    No slots available on this date. Try another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((timeStr) => (
                      <button
                        key={timeStr}
                        onClick={() => holdMutation.mutate({ startTime: timeStr })}
                        disabled={holdMutation.isPending}
                        className="py-2 px-1 border border-gray-200 rounded-lg font-sans text-[11px] font-bold text-center bg-[#faf9f7] hover:border-[#170f0a] text-[#170f0a] transition-colors disabled:opacity-40"
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
      </div>

      {/* ── STICKY BOTTOM CHECKOUT TRIGGER BAR ── */}
      {selectedServices.length > 0 && (
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-[#E5D3C2]/20 px-6 py-4 pb-safe flex items-center justify-between">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 w-full">
            <div>
              <span className="text-[#6B7280] font-sans text-[10px] font-bold tracking-widest block uppercase">SELECTED SERVICES</span>
              <span className="text-lg font-bold text-[#170f0a]">₹{(totalCost / 100).toFixed(0)}</span>
              <span className="text-[10px] text-gray-400 block font-semibold">{selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} · {totalDuration} mins</span>
            </div>
            
            <div className="flex-1 max-w-xs flex items-center gap-4 justify-end">
              <span className="text-[10px] font-bold text-gray-400 animate-pulse hidden sm:inline text-right leading-snug">
                Select a slot above to lock it and book
              </span>
              <button 
                onClick={() => {
                  if (slots.length > 0) {
                    toast.success("Select a time slot above to book!");
                  } else {
                    toast.error("Please add services and select a slot.");
                  }
                }}
                className="w-full h-12 md:h-14 bg-[#1A1410] hover:bg-[#2A2420] text-white rounded-xl font-sans text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-[#1A1410]/15 font-bold"
              >
                BOOK NOW
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

