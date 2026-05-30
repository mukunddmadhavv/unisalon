import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Clock, IndianRupee, Star, CheckCircle2 } from "lucide-react";
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

  // Fetch Shop Detail
  const { data: shop, isLoading, error } = useQuery<ShopDetail>({
    queryKey: ["shop-detail", slug],
    queryFn: () => api.getShopBySlug(slug!),
    enabled: !!slug,
  });

  // Fetch Slots
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

  // Hold Slot Mutation
  const holdMutation = useMutation({
    mutationFn: (data: { startTime: string }) => {
      return api.createSlotHold({
        shopId: shop!.id,
        staffId: selectedStaff || undefined,
        date: selectedDate,
        startTime: data.startTime,
        serviceIds: selectedServices,
      });
    },
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
    return {
      dateStr: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE"),
      dayNum: format(d, "d"),
    };
  });

  const handleDateSelect = (index: number, dateStr: string) => {
    setActiveDateIndex(index);
    setSelectedDate(dateStr);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div className="card p-8 max-w-md">
          <p className="text-red-400 font-semibold text-lg">Salon Profile Not Found</p>
          <p className="text-gray-500 text-sm mt-1">This salon does not exist, or has been suspended by system administrators.</p>
          <Link to="/" className="btn-primary mt-6 inline-block">Back to Discovery</Link>
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

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-24">
      {/* Cover Image Banner */}
      <div className="h-64 sm:h-96 relative bg-surface overflow-hidden">
        {shop.coverImage ? (
          <img src={shop.coverImage} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-surface-card border-b border-surface-border flex items-center justify-center text-4xl">
            🏪
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />

        <Link to="/" className="absolute top-6 left-6 btn-outline bg-surface-card/65 backdrop-blur-md py-1.5 px-4 rounded-xl text-xs flex items-center gap-1.5">
          &larr; Back
        </Link>
      </div>

      <div className="max-w-5xl w-full mx-auto px-6 -mt-20 relative z-10 space-y-8">
        <div className="card p-6 md:p-8 bg-surface-card/85 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">{shop.name}</h1>
              <span className="text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full uppercase">
                {shop.category}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">{shop.address}, {shop.city}, {shop.district}</p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/5 px-2 py-1 rounded-lg border border-yellow-500/10 font-bold">
                <Star size={12} className="fill-current" /> {shop.rating.toFixed(1)}
              </div>
              <span className="text-xs text-gray-500">{shop.totalReviews} customer reviews</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400 font-medium">Timings: {shop.openTime} - {shop.closeTime}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Services list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg text-white mb-4">Select Services</h2>
              <div className="divide-y divide-surface-border space-y-4">
                {shop.services.map((svc) => {
                  const isSelected = selectedServices.includes(svc.id);
                  return (
                    <div
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      className={`flex items-start gap-4 pt-4 first:pt-0 cursor-pointer group transition-colors`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? "bg-brand-500 border-brand-500 text-white" : "border-surface-border group-hover:border-brand-500"
                      }`}>
                        {isSelected && <CheckCircle2 size={13} className="fill-current" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold text-sm transition-colors ${isSelected ? "text-brand-400" : "text-white"}`}>
                            {svc.name}
                          </h4>
                          <div className="flex items-center gap-1 text-sm font-semibold text-white">
                            <IndianRupee size={12} className="text-green-400" />
                            <span>{(svc.price / 100).toFixed(0)}</span>
                          </div>
                        </div>
                        {svc.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{svc.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                          <Clock size={11} />
                          <span>{svc.durationMins} mins duration</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Staff selection */}
            {shop.staff.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display font-bold text-lg text-white mb-4">Choose Stylist (Optional)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setSelectedStaff(null)}
                    className={`card p-4 text-center cursor-pointer border hover:border-brand-500/50 transition-all ${
                      selectedStaff === null ? "border-brand-500 bg-brand-500/5 text-brand-400" : "border-surface-border text-gray-400"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold mx-auto mb-2 text-sm">
                      ★
                    </div>
                    <p className="font-semibold text-xs text-white">Any Available</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Quickest booking</p>
                  </div>

                  {shop.staff.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaff(member.id)}
                      className={`card p-4 text-center cursor-pointer border hover:border-brand-500/50 transition-all ${
                        selectedStaff === member.id ? "border-brand-500 bg-brand-500/5 text-brand-400" : "border-surface-border text-gray-400"
                      }`}
                    >
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover mx-auto mb-2 border border-surface-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-bold mx-auto mb-2 text-xs text-white">
                          {member.name[0].toUpperCase()}
                        </div>
                      )}
                      <p className="font-semibold text-xs text-white truncate">{member.name}</p>
                      {member.specialization && (
                        <p className="text-[9px] text-brand-500 truncate mt-0.5">{member.specialization}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Time Slot Grid */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 space-y-5 sticky top-24">
              <h3 className="font-display font-bold text-white text-md">Date & Time Slot</h3>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {dateOptions.map((opt, i) => (
                  <button
                    key={opt.dateStr}
                    onClick={() => handleDateSelect(i, opt.dateStr)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl min-w-[50px] border transition-all ${
                      activeDateIndex === i
                        ? "bg-brand-500 border-brand-500 text-white font-bold"
                        : "border-surface-border text-gray-500 hover:border-surface-border/80"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold">{opt.label}</span>
                    <span className="text-sm mt-0.5">{opt.dayNum}</span>
                  </button>
                ))}
              </div>

              {selectedServices.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-surface-border rounded-xl text-gray-500 text-xs">
                  Select at least one service to search open time slots.
                </div>
              ) : isSlotsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-surface-border rounded-xl text-gray-500 text-xs">
                  No slots available for this date. Choose a different date or select fewer services.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Available Slots</p>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((timeStr) => (
                      <button
                        key={timeStr}
                        onClick={() => holdMutation.mutate({ startTime: timeStr })}
                        disabled={holdMutation.isPending}
                        className="py-2 text-center rounded-xl bg-surface hover:bg-brand-500/10 hover:border-brand-500/50 border border-surface-border text-white text-xs font-semibold hover:text-brand-400 transition-all active:scale-95 disabled:opacity-40"
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

      {selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface-card/90 backdrop-blur-md border-t border-surface-border px-6 py-4 z-40 animate-slide-up">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500">{selectedServices.length} services selected ({totalDuration} mins)</span>
              <div className="flex items-center gap-1 font-bold text-lg text-white mt-0.5">
                <IndianRupee size={15} className="text-green-400" />
                <span>{(totalCost / 100).toFixed(0)}</span>
              </div>
            </div>
            <div className="text-xs text-brand-400 font-medium">
              Select date & time above to book
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
