import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/DashboardLayout";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { name: "HAIRCUT", label: "Haircut", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuADdqfLqM8icwCE9lXw3Lgfwj1QJXs5-rObeibSYNqz3So2cIzuG09Y72SxI7AX5-_-XJA5CiOAobUwyGsKdNQIUsrVFm8a6FKbsIyDYubt4xO6HicpxMeoR4jgDqWc6jZgPrS7c0nS_AbbGSCpYGl9DjoIOGoRcv5yW7YydEcTD4tucLAtgyyHs6gJQd2RKBM2Xr2viC8tBRazuSrhlpHZ6BKFlaU8451cxTv_YrM5w9yhoCAPQeqWHpb3nKqfIovLaJeBdrBOxMz4" },
  { name: "HAIR_COLOR", label: "Color", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCveYVz4YvvcOJlpeZg_KvkDgeerGYEE-rN4CZrckaI5Tb76uGNilec_Ylv1IG_IvP76eyh9Ic_lBqOn6_f_M9mu9eGy8xkqK0zGD6nRU6izOqcKLAQ2-uc6qbmM0iuJqAibJU5puTzHzyx1tHs9ZO5XHOzJuhK2CalxaSDsmpm8TmSNo7MkDSDep8GmY5oBFxZDsfk-oLzOiv4gjfd-nLk6fXOtPQpl_-anYxgXAsJnu5QsmKJxG0kJScMdmwLR70TP1KD7T6B0us3" },
  { name: "MASSAGE", label: "Massage", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDN1Wt0lGXd806SkG8Fj_2JRI9G_b2F7b2nX60mLw6o9As0lOYWdI9siDjCOXahBnAAATbbd_kGdmanEeOwIMXJ5ZKi7EbmwoVT6AIn2sBz7FiRSaqKCbsf6i88ZkfO8DtX8jXUiHIUJ323Mw6ZXip_1RxPKdM3Dq78Dv2g76_439f5xbzL8JEj1tf3_PYVYOAc9OdqmJnIaxZpiI8G92yU8heHaSjL3D8mF3m-Izpeap6f_pq_AdBVwn-hhIzeV1P5EVqR3PSBRctU" },
  { name: "FACIAL", label: "Facial", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjZugcVretu-rl9yNta6uLgiF5BDGrfXDGIIye952pF3Pko_J4dBBWny5aosls6TDlw5yg6c653-F7jeo6QvkIsyb1tHVLOkG2rDtVtRMd7EcRfnbdH-QKq0r4RY9Mu8OAtYIA8zFqvBIS9mwW_tvcb6u1Ef8HP2EIre4ry7kzoVZKtMnonrCkNtCz6yHECyYAOODqo0gBx3cLYwxusROAzcEOjFZIW2SQfTxvoEOzQaFXA61LGeeAx7Y0jbxEVf17-jUNBPHhDxun" },
  { name: "BEARD", label: "Beard", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMA6P4b5OkcBylTvcyVk2gDYh17iDrBU2b4DYA4QE0A8kz8Clj1ANmSlAtBMQVOlCgn1ZUEg5i57ta4y2nbQBwN07Oh9jgItdhJINcIv-mX3X3kVEcE3SSe_6UtvM3RU_BOV0pF9Ae2LSN9YUVH6aG717FsoClRoJHSHDa2Zi-_RRH6Q31QNWRwQdtgYaM1b3-_HiRO6dh7tIeDlh9C3djV8sDeSUsVzlPOp9H4KbjWdAxAjWK5vBad1pGBgzlG-pmnW3wXsgznhGo" },
];

interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  customCategoryName?: string;
  price: number;
  durationMins: number;
  isActive: boolean;
  imageUrl?: string;
}

interface ServiceFormData {
  shopId: string;
  name: string;
  description: string;
  category: string;
  customCategoryName: string;
  price: string;
  durationMins: string;
  imageUrl?: string;
}

interface ServiceModalProps {
  shopId: string;
  service?: Service | null;
  onClose: () => void;
}

function ServiceModal({ shopId, service, onClose }: ServiceModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ServiceFormData>({
    shopId,
    name: service?.name ?? "",
    description: service?.description ?? "",
    category: service?.category ?? "HAIRCUT",
    customCategoryName: service?.customCategoryName ?? "",
    price: service ? String(service.price / 100) : "",
    durationMins: service ? String(service.durationMins) : "45",
    imageUrl: service?.imageUrl ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (data: ServiceFormData) => {
      const payload = {
        shopId: data.shopId,
        name: data.name,
        description: data.description,
        category: data.category,
        customCategoryName: data.category === "OTHER" ? data.customCategoryName : undefined,
        price: Math.round(Number(data.price) * 100),
        durationMins: Number(data.durationMins),
        imageUrl: data.imageUrl || undefined,
      };
      return service ? api.updateService(service.id, payload) : api.createService(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(service ? "Service updated!" : "Service added successfully!");
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save service"),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `services/${shopId}/${Date.now()}-${file.name}`;
      const url = await api.uploadFile(file, "services", path);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopId) {
      toast.error("Please set up your shop profile first!");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-border-light p-6 w-full max-w-md rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-bold text-xl text-text-primary">
            {service ? "Edit Service" : "Add New Service"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-container rounded-full text-text-secondary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Service Name *</label>
            <input
              className="input"
              placeholder="e.g. Balayage Hair Color"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₹) *</label>
              <input
                className="input"
                type="number"
                min="1"
                placeholder="299"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Duration *</label>
              <select
                className="input bg-white"
                value={form.durationMins}
                onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))}
              >
                <option value="15">15 mins</option>
                <option value="30">30 mins</option>
                <option value="45">45 mins</option>
                <option value="60">60 mins</option>
                <option value="90">90 mins</option>
                <option value="120">120 mins</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Category *</label>
            <select
              className="input bg-white"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, customCategoryName: e.target.value !== "OTHER" ? "" : f.customCategoryName }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.label}</option>
              ))}
              <option value="OTHER">Other</option>
            </select>
          </div>
          {form.category === "OTHER" && (
            <div>
              <label className="label">Custom Category Name *</label>
              <input
                className="input"
                placeholder="e.g. Keratin Treatment"
                value={form.customCategoryName}
                onChange={(e) => setForm((f) => ({ ...f, customCategoryName: e.target.value }))}
                required
              />
            </div>
          )}
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Briefly describe the service steps..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Upload Photo</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {form.imageUrl ? (
              <div className="relative h-32 rounded-xl overflow-hidden border border-border-light group">
                <img src={form.imageUrl} className="w-full h-full object-cover" alt="Service thumbnail" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border-light rounded-xl h-24 flex flex-col items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined scale-110 mb-1">add_a_photo</span>
                <span className="font-sans text-xs font-bold">{uploading ? "Uploading..." : "Add service image"}</span>
              </button>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button
              type="submit"
              disabled={mutation.isPending || uploading}
              className="btn-primary flex-1 bg-primary text-white hover:opacity-90 transition-all shadow-sm"
            >
              {mutation.isPending ? "Saving..." : service ? "Update" : "Save Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [modal, setModal] = useState<{ open: boolean; service?: Service | null }>({ open: false });
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: shop } = useQuery({
    queryKey: ["owner-shop"],
    queryFn: async () => {
      const res = await api.getShop() as any;
      return res.data ?? res;
    },
  });

  const SHOP_ID = shop?.id ?? "";

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.getServices() as any;
      return res.data ?? res;
    },
    enabled: !!SHOP_ID,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service removed successfully");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to remove service"),
  });

  const statusToggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateService(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service visibility toggled!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to toggle visibility"),
  });

  const filteredServices = services.filter((s) => {
    const matchesCategory = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.description?.toLowerCase() ?? "").includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Offerings"
        subtitle="Configure your service catalog. Accurate times support slot blocking."
      />

      {/* Categories Horizontal Carousel */}
      <section className="bg-white border border-border-light rounded-xl p-5 shadow-sm">
        <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-text-secondary mb-4">Categories</h3>
        <div className="flex overflow-x-auto gap-5 pb-1 no-scrollbar scrollbar-hide">
          <div
            onClick={() => setSelectedCategory("ALL")}
            className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
          >
            <div className={`w-14 h-14 rounded-full border-2 overflow-hidden flex items-center justify-center font-display text-xs font-black transition-all ${
              selectedCategory === "ALL" ? "border-primary bg-primary text-white" : "border-border-light bg-background text-text-primary hover:border-primary"
            }`}>
              ALL
            </div>
            <span className={`font-sans text-[11px] font-bold ${selectedCategory === "ALL" ? "text-primary" : "text-text-secondary"}`}>All</span>
          </div>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
            >
              <div className={`w-14 h-14 rounded-full border-2 overflow-hidden transition-all ${
                selectedCategory === cat.name ? "border-primary p-0.5" : "border-border-light p-0"
              }`}>
                <img src={cat.image} className="w-full h-full rounded-full object-cover" alt={cat.label} />
              </div>
              <span className={`font-sans text-[11px] font-bold ${selectedCategory === cat.name ? "text-primary" : "text-text-secondary"}`}>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary scale-90">search</span>
          <input
            className="input pl-10"
            placeholder="Search services..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button onClick={() => setSearch("")} className="btn-outline px-4 font-bold text-xs">Clear</button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : !SHOP_ID ? (
        <div className="card p-12 text-center bg-white rounded-xl shadow-sm border border-border-light">
          <span className="material-symbols-outlined text-4xl text-text-secondary mb-3">storefront</span>
          <p className="font-sans font-bold text-sm text-text-primary">Profile Setup Required</p>
          <p className="font-sans text-xs text-text-secondary mt-1 mb-6 max-w-sm mx-auto leading-relaxed">
            Please fill in your shop profile details before adding services to your menu.
          </p>
          <Link to="/shop/edit" className="btn-primary mx-auto text-xs font-bold">
            Setup Shop Profile
          </Link>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="card p-12 text-center bg-white rounded-xl shadow-sm border border-border-light">
          <span className="material-symbols-outlined text-4xl text-text-secondary mb-3">content_cut</span>
          <p className="font-sans font-bold text-sm text-text-primary">No services found</p>
          <p className="font-sans text-xs text-text-secondary mt-1 mb-6">
            {selectedCategory === "ALL" ? "Create your salon offerings to start receiving bookings." : `No services listed under ${selectedCategory.replace("_", " ")}.`}
          </p>
          {selectedCategory === "ALL" && (
            <button onClick={() => setModal({ open: true, service: null })} className="btn-primary mx-auto text-xs font-bold">
              Add First Service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl p-4 border transition-all duration-300 flex gap-4 shadow-sm service-card relative ${
                s.isActive ? "border-border-light" : "border-border-light opacity-60 bg-gray-50/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary bg-background border border-border-light px-2.5 py-0.5 rounded-full">
                    {s.category === "OTHER" && s.customCategoryName ? s.customCategoryName : s.category.replace("_", " ")}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModal({ open: true, service: s })}
                      className="p-1 hover:bg-surface-container rounded-full text-text-secondary hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined scale-90">edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this service?")) {
                          deleteMutation.mutate(s.id);
                        }
                      }}
                      className="p-1 hover:bg-error-container hover:text-error rounded-full text-text-secondary transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined scale-90">delete</span>
                    </button>
                  </div>
                </div>

                <h4 className="font-sans text-sm font-bold text-text-primary truncate">{s.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display text-sm font-extrabold text-primary">₹{(s.price / 100).toFixed(0)}</span>
                  <span className="text-text-secondary text-xs">•</span>
                  <span className="font-sans text-xs text-text-secondary">{s.durationMins} mins</span>
                </div>
                {s.description && (
                  <p className="font-sans text-xs text-text-secondary leading-relaxed line-clamp-2 mt-2">
                    {s.description}
                  </p>
                )}
              </div>
              <div className="w-20 h-20 rounded-lg overflow-hidden relative border border-border-light flex-shrink-0 bg-background flex items-center justify-center">
                {s.imageUrl ? (
                  <img src={s.imageUrl} className="w-full h-full object-cover" alt={s.name} />
                ) : (
                  <span className="material-symbols-outlined text-text-secondary scale-110">content_cut</span>
                )}
                <div className="absolute bottom-1 right-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.isActive}
                      onChange={() => statusToggleMutation.mutate({ id: s.id, isActive: !s.isActive })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rating-green"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => {
          if (!SHOP_ID) {
            toast.error("Please set up your shop profile first!");
            return;
          }
          setModal({ open: true, service: null });
        }}
        className="fixed bottom-24 right-6 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform"
        title="Add New Service"
      >
        <span className="material-symbols-outlined scale-125">add</span>
      </button>

      {modal.open && (
        <ServiceModal
          shopId={SHOP_ID}
          service={modal.service}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

import { useRef } from "react";
