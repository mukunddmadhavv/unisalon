import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, ChevronRight, Upload, X } from "lucide-react";
import { api } from "../lib/api";
import toast from "react-hot-toast";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const CATEGORIES = [
  { value: "MALE", label: "Barbershop (Men)" },
  { value: "FEMALE", label: "Beauty Salon (Women)" },
  { value: "UNISEX", label: "Unisex Salon" },
];
const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

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
  const [step, setStep] = useState(1);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    category: "UNISEX",
    address: "",
    city: "",
    district: "",
    state: "Maharashtra",
    pincode: "",
    openTime: "09:00",
    closeTime: "21:00",
    workingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
    latitude: "",
    longitude: "",
  });

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
      () => toast.error("Couldn't get location — you can enter it manually later")
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let coverImage: string | undefined;
      if (coverFile) {
        const path = `covers/${Date.now()}-${coverFile.name}`;
        coverImage = await api.uploadFile(coverFile, "shop-images", path);
      }
      return api.createShop({
        ...form,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        coverImage,
      });
    },
    onSuccess: () => {
      toast.success("🎉 Shop submitted for review!");
      navigate("/dashboard");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const steps = [
    { n: 1, label: "Basic Info" },
    { n: 2, label: "Location" },
    { n: 3, label: "Hours" },
    { n: 4, label: "Photos" },
  ];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">✂️</span>
          <span className="font-display font-bold text-xl">
            <span className="text-brand-500">Uni</span>Salon
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-2">Set up your shop</h1>
        <p className="text-gray-400 mb-8">Fill in your shop details. Our team will review and approve within 24 hours.</p>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.n ? "bg-green-500 text-white" : step === s.n ? "bg-brand-500 text-white" : "bg-surface-muted text-gray-500"
              }`}>{step > s.n ? "✓" : s.n}</div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.n ? "text-white" : "text-gray-600"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-px w-8 ${step > s.n ? "bg-green-500" : "bg-surface-border"}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display font-semibold text-lg text-white mb-4">Basic Information</h2>
              <div>
                <label className="label">Shop name *</label>
                <input className="input" placeholder="Raj's Premium Salon" value={form.name}
                  onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div>
                <label className="label">Category *</label>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} type="button" onClick={() => set("category", c.value)}
                      className={`p-3 rounded-xl border text-sm font-medium text-center transition-all ${
                        form.category === c.value
                          ? "border-brand-500 bg-brand-500/10 text-brand-400"
                          : "border-surface-border text-gray-400 hover:border-surface-muted"
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} placeholder="Tell customers what makes your shop special..."
                  value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display font-semibold text-lg text-white mb-4">Shop Location</h2>
              <div>
                <label className="label">Full address *</label>
                <input className="input" placeholder="Shop No. 12, Main Street..." value={form.address}
                  onChange={(e) => set("address", e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">City *</label>
                  <input className="input" placeholder="Mumbai" value={form.city}
                    onChange={(e) => set("city", e.target.value)} required />
                </div>
                <div>
                  <label className="label">District *</label>
                  <input className="input" placeholder="Mumbai Suburban" value={form.district}
                    onChange={(e) => set("district", e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">State *</label>
                  <select className="input" value={form.state} onChange={(e) => set("state", e.target.value)}>
                    {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Pincode *</label>
                  <input className="input" placeholder="400001" maxLength={6} value={form.pincode}
                    onChange={(e) => set("pincode", e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="label">GPS Coordinates (optional)</label>
                <div className="flex gap-3">
                  <input className="input text-sm" placeholder="Latitude" value={form.latitude}
                    onChange={(e) => set("latitude", e.target.value)} />
                  <input className="input text-sm" placeholder="Longitude" value={form.longitude}
                    onChange={(e) => set("longitude", e.target.value)} />
                  <button type="button" onClick={handleGetLocation}
                    className="btn-outline text-sm px-4 flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                    <MapPin size={14} /> Get Location
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Helps customers find your shop on the map</p>
              </div>
            </div>
          )}

          {/* Step 3 — Hours */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-display font-semibold text-lg text-white mb-4">Opening Hours</h2>
              <div>
                <label className="label">Working Days *</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.workingDays.includes(d)
                          ? "bg-brand-500 border-brand-500 text-white"
                          : "border-surface-border text-gray-400 hover:border-surface-muted"
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Opening time *</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="time" className="input pl-9" value={form.openTime}
                      onChange={(e) => set("openTime", e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="label">Closing time *</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="time" className="input pl-9" value={form.closeTime}
                      onChange={(e) => set("closeTime", e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4">
                <p className="text-sm text-brand-400 font-medium">Preview</p>
                <p className="text-sm text-gray-300 mt-1">
                  Open {form.openTime} – {form.closeTime} on {form.workingDays.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Step 4 — Photos */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-display font-semibold text-lg text-white mb-4">Shop Photos</h2>
              <div>
                <label className="label">Cover photo</label>
                <div
                  onClick={() => document.getElementById("cover-upload")?.click()}
                  className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${
                    coverPreview ? "border-brand-500" : "border-surface-border hover:border-surface-muted"
                  }`}
                >
                  {coverPreview ? (
                    <div className="relative">
                      <img src={coverPreview} alt="Cover" className="w-full h-48 object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCoverPreview(""); setCoverFile(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center gap-2 text-gray-500">
                      <Upload size={24} />
                      <span className="text-sm">Click to upload cover photo</span>
                      <span className="text-xs">JPG, PNG, WebP up to 10MB</span>
                    </div>
                  )}
                </div>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                  }}
                />
              </div>
              <div className="bg-surface rounded-xl p-4 border border-surface-border">
                <p className="text-sm text-gray-400">
                  ✅ Your shop will be submitted for review after this step.
                  Our team approves shops within <strong className="text-white">24 hours</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-surface-border">
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)} className="btn-outline">
                Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !form.name) ||
                  (step === 2 && (!form.address || !form.city || !form.district || !form.pincode)) ||
                  (step === 3 && form.workingDays.length === 0)
                }
                className="btn-primary flex items-center gap-2"
              >
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {mutation.isPending ? "Submitting..." : "Submit for Review ✨"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
