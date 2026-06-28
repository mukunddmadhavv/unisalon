import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Compass, ChevronLeft, Save } from "lucide-react";
import { ImageCropperModal } from "@unisalon/ui";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { STATES, STATES_AND_DISTRICTS } from "../lib/locationData";


// ── Main ShopSetupPage Component ───────────────────────────────────
interface FormState {
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  openTime: string;
  closeTime: string;
  workingDays: string[];
  latitude: string;
  longitude: string;
}

export default function ShopSetupPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [galleryImages, setGalleryImages] = useState<string[]>(Array(10).fill(""));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);
  const [cropModalIndex, setCropModalIndex] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    category: "UNISEX",
    address: "",
    city: "",
    district: "Pune",
    state: "Maharashtra",
    pincode: "",
    openTime: "09:00",
    closeTime: "21:00",
    workingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
    latitude: "",
    longitude: "",
  });

  // Query to fetch the owner's existing shop
  const { data: existingShop, isLoading } = useQuery({
    queryKey: ["owner-shop"],
    queryFn: async () => {
      try {
        const res = await api.getShop() as any;
        return res.data ?? res;
      } catch (e) {
        return null;
      }
    },
  });

  // Sync existing shop to form state
  useEffect(() => {
    if (existingShop) {
      setForm({
        name: existingShop.name ?? "",
        description: existingShop.description ?? "",
        category: existingShop.category ?? "UNISEX",
        address: existingShop.address ?? "",
        city: existingShop.city ?? "",
        district: existingShop.district ?? "",
        state: existingShop.state ?? "Maharashtra",
        pincode: existingShop.pincode ?? "",
        openTime: existingShop.openTime ?? "09:00",
        closeTime: existingShop.closeTime ?? "21:00",
        workingDays: existingShop.workingDays ?? ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
        latitude: existingShop.latitude ? String(existingShop.latitude) : "",
        longitude: existingShop.longitude ? String(existingShop.longitude) : "",
      });
      const initialImages: string[] = [];
      if (existingShop.coverImage) initialImages.push(existingShop.coverImage);
      if (existingShop.images && Array.isArray(existingShop.images)) {
        initialImages.push(...existingShop.images);
      }
      while (initialImages.length < 10) {
        initialImages.push("");
      }
      setGalleryImages(initialImages);
    }
  }, [existingShop]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", String(pos.coords.latitude));
        set("longitude", String(pos.coords.longitude));
        toast.success("Location captured!");
      },
      () => toast.error("Couldn't capture location — you can enter it manually.")
    );
  };

  const handleUploadImageClick = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropModalSrc(reader.result as string);
      setCropModalIndex(index);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    if (cropModalIndex === null) return;
    const index = cropModalIndex;
    setCropModalSrc(null);
    setCropModalIndex(null);

    setUploadingIndex(index);
    try {
      const file = new File([blob], `image_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const path = `shops/${existingShop?.id || "temp"}/gallery_${index}_${Date.now()}`;
      const url = await api.uploadFile(file, "shop-images", path);
      
      setGalleryImages((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
      toast.success(`Photo #${index + 1} uploaded!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveImageClick = (index: number) => {
    setGalleryImages((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  const croppedPreview = galleryImages.find((url) => url !== "") || "";

  // Mutation to create a new shop (Wizard setup flow)
  const createMutation = useMutation({
    mutationFn: async () => {
      const activeUrls = galleryImages.filter((url) => url !== "");
      if (activeUrls.length < 2) {
        throw new Error("You must upload at least 2 photos (the Cover Image and at least one secondary photo) before submitting.");
      }
      return api.createShop({
        ...form,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        coverImage: activeUrls[0],
        images: activeUrls.slice(1),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-shop"] });
      toast.success("🎉 Shop setup complete and submitted for review!");
      navigate("/dashboard");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create shop"),
  });

  // Mutation to update an existing shop (Shop Profile editor flow)
  const updateMutation = useMutation({
    mutationFn: async () => {
      const activeUrls = galleryImages.filter((url) => url !== "");
      if (activeUrls.length < 2) {
        throw new Error("You must upload at least 2 photos before saving changes.");
      }
      return api.updateShop(existingShop.id, {
        ...form,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        coverImage: activeUrls[0],
        images: activeUrls.slice(1),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-shop"] });
      toast.success("🎉 Shop profile updated successfully!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update shop"),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── RENDER 1: EDIT PROFILE DASHBOARD (If shop already exists) ─────
  if (existingShop) {
    const isSaveDisabled = updateMutation.isPending || !form.name || !form.address || !form.city || !form.district || !form.pincode;
    return (
      <>
        <div className="animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary tracking-tight">Shop Profile</h2>
              <p className="font-sans text-sm text-on-surface-variant">Manage your shop's public identity and operating details.</p>
            </div>
            <button
              onClick={() => updateMutation.mutate()}
              disabled={isSaveDisabled}
              className="bg-primary text-on-primary px-8 py-3 rounded-lg font-sans font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Bento grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Business Details (Left Panel) */}
            <section className="lg:col-span-8 space-y-6">
              {/* General business details */}
              <div className="bento-card p-6 rounded-xl space-y-4">
                <h3 className="font-display text-base font-bold text-on-surface flex items-center gap-2 border-b border-surface-container-high pb-4 mb-2">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  Business Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="label">Business Name *</label>
                    <input
                      className="input"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Description / Bio</label>
                    <textarea
                      className="input resize-none"
                      rows={3}
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Introduce your salon, specialty services, and experience..."
                    />
                  </div>
                </div>
              </div>

              {/* Media Gallery grid */}
              <div className="bento-card p-6 rounded-xl space-y-4">
                <h3 className="font-display text-base font-bold text-on-surface flex items-center gap-2 border-b border-surface-container-high pb-4 mb-2">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                  Media Gallery (Min 2, Max 10 photos)
                </h3>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Upload up to 10 photos of your salon. 
                  The <strong>first photo</strong> in the sequence will automatically be set as your Cover Photo.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {galleryImages.map((imageUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square border border-surface-container-high bg-surface-container rounded-xl overflow-hidden group flex flex-col items-center justify-center transition-all hover:border-primary"
                    >
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt={`Gallery #${idx + 1}`} className="w-full h-full object-cover" />
                          
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-surface-container-high/40">
                            {idx === 0 ? "1 (Cover)" : idx + 1}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveImageClick(idx)}
                            className="absolute top-2 right-2 p-1 bg-error hover:bg-error/90 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Photo"
                          >
                            <span className="material-symbols-outlined text-[12px] block">close</span>
                          </button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 text-center hover:bg-surface-container-low select-none">
                          {uploadingIndex === idx ? (
                            <div className="w-5 h-5 border-2 border-surface-container-high border-t-primary rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-outline text-[20px] mb-1">add_photo_alternate</span>
                              <span className="font-sans text-[9px] font-bold text-outline">Photo #{idx + 1}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingIndex !== null}
                            onChange={(e) => handleUploadImageClick(idx, e)}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Profile Preview Mockup (Right Panel) */}
            <section className="lg:col-span-4 bento-card p-6 rounded-xl space-y-4">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-surface-container-high pb-4 mb-2">
                Marketplace Preview
              </h3>
              <div className="border border-surface-container-high rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="aspect-video w-full bg-surface-container relative overflow-hidden flex items-center justify-center text-outline-variant">
                  {croppedPreview ? (
                    <img src={croppedPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[36px]">image</span>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5 text-[9px] text-white font-bold tracking-wider flex items-center gap-0.5">
                    ★ 5.0
                  </div>
                </div>
                <div className="p-4 space-y-1.5">
                  <h4 className="font-display font-bold text-sm text-on-surface truncate">{form.name || "Salon Name"}</h4>
                  <p className="font-sans text-[10px] text-secondary font-bold uppercase tracking-wider">{form.category}</p>
                  <p className="font-sans text-[11px] text-on-surface-variant truncate flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">map</span>
                    {form.city || "City Location"}
                  </p>
                </div>
              </div>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed italic mt-2">
                Your shop is currently listed as <span className="font-bold text-secondary">{existingShop.status}</span>. Changes will update instantly in the directory.
              </p>
            </section>

            {/* Location (Left) */}
            <section className="lg:col-span-6 bento-card p-6 rounded-xl space-y-4">
              <h3 className="font-display text-base font-bold text-on-surface flex items-center gap-2 border-b border-surface-container-high pb-4 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                Location Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Street Address *</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">State *</label>
                    <select
                      className="input bg-white cursor-pointer"
                      value={form.state}
                      onChange={(e) => {
                        const newState = e.target.value;
                        const dists = STATES_AND_DISTRICTS[newState] || [];
                        setForm((prev) => ({
                          ...prev,
                          state: newState,
                          district: dists[0] || "",
                        }));
                      }}
                      required
                    >
                      <option value="">Select State</option>
                      {STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">District *</label>
                    <select
                      className="input bg-white cursor-pointer"
                      value={form.district}
                      onChange={(e) => set("district", e.target.value)}
                      required
                      disabled={!form.state}
                    >
                      <option value="">Select District</option>
                      {(STATES_AND_DISTRICTS[form.state] || []).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">City *</label>
                    <input
                      className="input"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Pincode *</label>
                    <input
                      className="input"
                      value={form.pincode}
                      onChange={(e) => set("pincode", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Geolocation */}
                <div className="pt-2 border-t border-surface-container-high">
                  <label className="label">Map Coordinates (Optional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      className="input"
                      placeholder="Latitude"
                      value={form.latitude}
                      onChange={(e) => set("latitude", e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Longitude"
                      value={form.longitude}
                      onChange={(e) => set("longitude", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="btn-outline !p-3 flex items-center justify-center hover:bg-surface-container-low"
                      title="Fetch current coordinates"
                    >
                      <Compass size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Operating Hours (Right) */}
            <section className="lg:col-span-6 bento-card p-6 rounded-xl space-y-4">
              <h3 className="font-display text-base font-bold text-on-surface flex items-center gap-2 border-b border-surface-container-high pb-4 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                Operation Hours
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Open Time *</label>
                    <input
                      className="input"
                      type="time"
                      value={form.openTime}
                      onChange={(e) => set("openTime", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Close Time *</label>
                    <input
                      className="input"
                      type="time"
                      value={form.closeTime}
                      onChange={(e) => set("closeTime", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Working Days */}
                <div>
                  <label className="label mb-3">Operating Days *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => {
                      const isActive = form.workingDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`py-2 px-3 rounded-lg font-sans text-xs font-bold transition-all ${
                            isActive
                              ? "bg-primary text-white border border-primary shadow-sm"
                              : "bg-surface-container text-on-surface-variant border border-surface-container-high hover:bg-surface-container-high"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Selection */}
                <div className="pt-2 border-t border-surface-container-high">
                  <label className="label mb-3">Salon Service Category *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["MALE", "FEMALE", "UNISEX"].map((c) => {
                      const isActive = form.category === c;
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => set("category", c)}
                          className={`py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all ${
                            isActive
                              ? "bg-primary text-white shadow-sm"
                              : "bg-surface-container text-on-surface-variant border border-surface-container-high hover:bg-surface-container-high"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        {cropModalSrc && (
          <ImageCropperModal
            imageSrc={cropModalSrc}
            onClose={() => {
              setCropModalSrc(null);
              setCropModalIndex(null);
            }}
            onCropComplete={handleCropComplete}
            aspectRatio={16 / 9}
          />
        )}
      </>
    );
  }

  // ── RENDER 2: FIRST TIME SETUP WIZARD (If shop does not exist) ────
  return (
    <>

      <div className="min-h-screen bg-surface flex items-center justify-center p-6 select-none font-sans">
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-outline-variant animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <span className="font-display font-bold text-2xl">
              <span className="text-primary">Uni</span>Salon Setup
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex justify-between mb-8 items-center relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-surface-container-high -z-10" />
            {[1, 2, 3, 4].map((stepIdx) => {
              const isActive = step === stepIdx;
              const isPassed = step > stepIdx;
              return (
                <div key={stepIdx} className="flex flex-col items-center gap-2 bg-white px-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isActive
                        ? "bg-primary text-white ring-4 ring-primary/20"
                        : isPassed
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant border border-surface-container-high"
                    }`}
                  >
                    {isPassed ? "✓" : stepIdx}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                Basic Shop Details
              </h2>
              <div>
                <label className="label">Business Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Elegant Hair & Spa Studio"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Description / Bio</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  placeholder="Introduce your salon specialties to potential clients..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div>
                <label className="label mb-3">Service Category *</label>
                <div className="grid grid-cols-3 gap-3">
                  {["MALE", "FEMALE", "UNISEX"].map((c) => {
                    const isActive = form.category === c;
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => set("category", c)}
                        className={`py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all ${
                          isActive
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container text-on-surface-variant border border-outline-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">map</span>
                Where is your shop located?
              </h2>
              <div>
                <label className="label">Street Address *</label>
                <input
                  className="input"
                  placeholder="Flat No, Building, Area/Sector..."
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">State *</label>
                  <select
                    className="input bg-white cursor-pointer"
                    value={form.state}
                    onChange={(e) => {
                      const newState = e.target.value;
                      const dists = STATES_AND_DISTRICTS[newState] || [];
                      setForm((prev) => ({
                        ...prev,
                        state: newState,
                        district: dists[0] || "",
                      }));
                    }}
                    required
                  >
                    <option value="">Select State</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">District *</label>
                  <select
                    className="input bg-white cursor-pointer"
                    value={form.district}
                    onChange={(e) => set("district", e.target.value)}
                    required
                    disabled={!form.state}
                  >
                    <option value="">Select District</option>
                    {(STATES_AND_DISTRICTS[form.state] || []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">City *</label>
                  <input
                    className="input"
                    placeholder="Mumbai, Pune, Delhi..."
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Pincode *</label>
                  <input
                    className="input"
                    placeholder="411001"
                    value={form.pincode}
                    onChange={(e) => set("pincode", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-surface-container-high flex flex-col gap-2">
                <label className="label">Enable Geolocation (Captures coordinates)</label>
                <div className="flex items-center gap-3">
                  <input
                    className="input"
                    placeholder="Latitude"
                    value={form.latitude}
                    onChange={(e) => set("latitude", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Longitude"
                    value={form.longitude}
                    onChange={(e) => set("longitude", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="btn-outline !p-3 flex items-center justify-center hover:bg-surface-container-low"
                  >
                    <Compass size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Operating Hours */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Operating Hours & Workdays
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Open Time *</label>
                  <input
                    className="input"
                    type="time"
                    value={form.openTime}
                    onChange={(e) => set("openTime", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Close Time *</label>
                  <input
                    className="input"
                    type="time"
                    value={form.closeTime}
                    onChange={(e) => set("closeTime", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label mb-3">Operating Days *</label>
                <div className="grid grid-cols-4 gap-2">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => {
                    const isActive = form.workingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`py-2 px-3 rounded-lg font-sans text-xs font-bold transition-all ${
                          isActive
                            ? "bg-primary text-white border border-primary shadow-sm"
                            : "bg-surface-container text-on-surface-variant border border-surface-container-high hover:bg-surface-container-high"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">image</span>
                Media Gallery (Min 2, Max 10 photos)
              </h2>
              
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Upload up to 10 photos of your salon. 
                The <strong>first photo</strong> in the sequence will automatically be set as your Cover Photo.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {galleryImages.map((imageUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square border border-surface-container-high bg-surface-container rounded-xl overflow-hidden group flex flex-col items-center justify-center transition-all hover:border-primary"
                    >
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt={`Gallery #${idx + 1}`} className="w-full h-full object-cover" />
                          
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-surface-container-high/40">
                            {idx === 0 ? "1 (Cover)" : idx + 1}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveImageClick(idx)}
                            className="absolute top-2 right-2 p-1 bg-error hover:bg-error/90 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Photo"
                          >
                            <span className="material-symbols-outlined text-[12px] block">close</span>
                          </button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 text-center hover:bg-surface-container-low select-none">
                          {uploadingIndex === idx ? (
                            <div className="w-5 h-5 border-2 border-surface-container-high border-t-primary rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-outline text-[20px] mb-1">add_photo_alternate</span>
                              <span className="font-sans text-[9px] font-bold text-outline">Photo #{idx + 1}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingIndex !== null}
                            onChange={(e) => handleUploadImageClick(idx, e)}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>

                {/* Storage Info Box */}
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
                  <div>
                    <p className="font-sans font-bold text-xs text-on-surface">Photo Storage Information</p>
                    <p className="font-sans text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                      All uploaded photos are securely stored in the <strong className="text-on-surface">Supabase Storage</strong> CDN bucket. Public URLs will be synced directly with your shop metadata.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-surface-container-high">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="btn-outline flex items-center gap-1.5"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !form.name) ||
                  (step === 2 && (!form.address || !form.city || !form.district || !form.pincode)) ||
                  (step === 3 && form.workingDays.length === 0)
                }
                className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="btn-primary flex items-center gap-1.5"
              >
                <Save size={16} /> {createMutation.isPending ? "Submitting..." : "Submit for Review ✨"}
              </button>
            )}
          </div>
        </div>
      </div>
      {cropModalSrc && (
        <ImageCropperModal
          imageSrc={cropModalSrc}
          onClose={() => {
            setCropModalSrc(null);
            setCropModalIndex(null);
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
        />
      )}
    </>
  );
}
