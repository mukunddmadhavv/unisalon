import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Clock, IndianRupee, Tag } from "lucide-react";
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
      toast.success(service ? "Service updated" : "Service added!");
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <h2 className="font-display font-semibold text-xl text-white mb-6">
          {service ? "Edit Service" : "Add Service"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Service name</label>
            <input className="input" placeholder="e.g. Classic Haircut" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₹)</label>
              <input className="input" type="number" min="1" placeholder="299" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Duration (mins)</label>
              <input className="input" type="number" min="5" max="480" placeholder="30" value={form.durationMins}
                onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input resize-none" rows={2} placeholder="Brief description..."
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
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
  const qc = useQueryClient();

  // In a real app you'd have shop context — using a stub shopId for now
  const SHOP_ID = ""; // Will come from shop context after shop is created

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      // Fetch via shop slug/detail — will be wired via ShopContext
      return [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Manage what you offer. Duration drives slot availability for customers."
        actions={
          <button onClick={() => setModal({ open: true, service: null })} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Service
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="card p-12 text-center">
          <Tag size={36} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No services yet</p>
          <p className="text-gray-600 text-sm mb-6">Add services customers can book</p>
          <button onClick={() => setModal({ open: true, service: null })} className="btn-primary mx-auto">
            Add your first service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className="card p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-brand-400 font-medium bg-brand-500/10 px-2 py-0.5 rounded-full">
                    {s.category.replace("_", " ")}
                  </span>
                  <h3 className="font-semibold text-white mt-2">{s.name}</h3>
                  {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal({ open: true, service: s })} className="p-1.5 rounded-lg hover:bg-surface text-gray-400 hover:text-white transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 rounded-lg hover:bg-surface text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-border">
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <IndianRupee size={14} className="text-green-400" />
                  <span>{(s.price / 100).toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Clock size={13} />
                  <span>{s.durationMins} min</span>
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
