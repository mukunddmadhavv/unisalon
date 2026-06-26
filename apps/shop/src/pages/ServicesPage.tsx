import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/DashboardLayout";
import { api } from "../lib/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  "HAIRCUT", "BEARD", "FACIAL", "MASSAGE",
  "HAIR_COLOR", "HAIR_SPA", "WAXING", "KERATIN", "STRAIGHTENING", "OTHER",
];

interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  durationMins: number;
  isActive: boolean;
}

interface ServiceFormData {
  shopId: string;
  name: string;
  description: string;
  category: string;
  price: string;
  durationMins: string;
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
    price: service ? String(service.price / 100) : "",
    durationMins: service ? String(service.durationMins) : "",
  });

  const mutation = useMutation({
    mutationFn: (data: ServiceFormData) => {
      const payload = {
        shopId: data.shopId,
        name: data.name,
        description: data.description,
        category: data.category,
        price: Math.round(Number(data.price) * 100),
        durationMins: Number(data.durationMins),
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
      <div className="relative bg-white border border-surface-container-high p-6 w-full max-w-md rounded-2xl shadow-2xl animate-slide-up">
        <h2 className="font-display font-bold text-xl text-on-surface mb-6">
          {service ? "Edit Service" : "Add New Service"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Service Name *</label>
            <input
              className="input"
              placeholder="e.g. Classic Haircut"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Category *</label>
            <select
              className="input bg-white"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
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
              <label className="label">Duration (mins) *</label>
              <input
                className="input"
                type="number"
                min="5"
                max="480"
                placeholder="30"
                value={form.durationMins}
                onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Brief description of the service..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1 bg-primary hover:opacity-90 transition-all shadow-sm"
            >
              {mutation.isPending ? "Saving..." : service ? "Update" : "Add Service"}
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
  const qc = useQueryClient();

  // Fetch owner's shop first
  const { data: shop } = useQuery({
    queryKey: ["owner-shop"],
    queryFn: async () => {
      const res = await api.getShop() as any;
      return res.data ?? res;
    },
  });

  const SHOP_ID = shop?.id ?? "";

  // Fetch services
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

  const filteredServices = selectedCategory === "ALL"
    ? services
    : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="animate-fade-in select-none">
      <PageHeader
        title="Services & Menu"
        subtitle="Manage your styling menu. Accurate durations drive booking slot availability."
        actions={
          <button
            onClick={() => {
              if (!SHOP_ID) {
                toast.error("Please set up your shop profile details first!");
                return;
              }
              setModal({ open: true, service: null });
            }}
            className="btn-primary flex items-center gap-2 bg-primary text-on-primary"
          >
            <span className="material-symbols-outlined text-[20px]">add</span> Add Service
          </button>
        }
      />

      {/* Category Filter Strips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-5 py-2 rounded-full font-sans text-xs font-bold transition-all whitespace-nowrap ${
            selectedCategory === "ALL"
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high"
          }`}
        >
          All Services
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-full font-sans text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : !SHOP_ID ? (
        <div className="bento-card p-12 text-center bg-white rounded-xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-3">storefront</span>
          <p className="text-on-surface-variant font-bold text-base">Setup Profile Required</p>
          <p className="text-on-surface-variant opacity-60 text-sm mb-6 max-w-sm mx-auto">
            You must set up and save your shop profile before adding services.
          </p>
          <Link to="/shop/edit" className="btn-primary mx-auto">
            Go to Shop Profile
          </Link>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bento-card p-12 text-center bg-white rounded-xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-3">content_cut</span>
          <p className="text-on-surface-variant font-bold text-base">No services found</p>
          <p className="text-on-surface-variant opacity-60 text-sm mb-6">
            {selectedCategory === "ALL" ? "Add services to build your salon booking menu." : `No services under ${selectedCategory.replace("_", " ")}.`}
          </p>
          {selectedCategory === "ALL" && (
            <button onClick={() => setModal({ open: true, service: null })} className="btn-primary mx-auto">
              Add your first service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl p-5 border border-surface-container-high group hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2.5 py-1 rounded-full border border-secondary/10">
                    {s.category.replace("_", " ")}
                  </span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModal({ open: true, service: s })}
                      className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this service?")) {
                          deleteMutation.mutate(s.id);
                        }
                      }}
                      className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                <h3 className="font-display font-bold text-lg text-on-surface mb-1 group-hover:text-secondary transition-colors truncate">
                  {s.name}
                </h3>
                {s.description && (
                  <p className="font-sans text-xs text-on-surface-variant leading-relaxed line-clamp-2 mt-1">
                    {s.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-container-high">
                <div>
                  <span className="font-sans text-[10px] text-on-surface-variant block uppercase tracking-wider">Price</span>
                  <span className="font-display font-extrabold text-base text-primary">₹{(s.price / 100).toFixed(0)}</span>
                </div>
                <div className="text-right">
                  <span className="font-sans text-[10px] text-on-surface-variant block uppercase tracking-wider">Duration</span>
                  <span className="font-sans font-bold text-xs flex items-center justify-end gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                    {s.durationMins} min
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

// Helper Link import so it compiles
import { Link } from "react-router-dom";
