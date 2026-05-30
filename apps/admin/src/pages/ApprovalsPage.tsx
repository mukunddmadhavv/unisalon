import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/AdminLayout";
import { api } from "../lib/api";
import { Check, X, Mail, Phone, Clock, MapPin } from "lucide-react";
import toast from "react-hot-toast";

interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  status: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  openTime: string;
  closeTime: string;
  workingDays: string[];
  coverImage?: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data: response, isLoading } = useQuery<{ shops: Shop[]; total: number }>({
    queryKey: ["pending-shops"],
    queryFn: () => api.getShops({ status: "PENDING" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.approveShop(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-shops"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Shop approved and is now live!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to approve shop"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.rejectShop(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-shops"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setRejectId(null);
      setReason("");
      toast.success("Shop registration rejected.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reject shop"),
  });

  const handleApprove = (id: string) => {
    if (confirm("Are you sure you want to approve this salon registration?")) {
      approveMutation.mutate(id);
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId || !reason.trim()) return;
    rejectMutation.mutate({ id: rejectId, reason });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const shops = response?.shops ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listing Approvals"
        subtitle="Review new salon registration requests. Approved shops will immediately go live for customer bookings."
      />

      {shops.length === 0 ? (
        <div className="card p-16 text-center max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-surface-border text-gray-400">
            <Check size={28} />
          </div>
          <h3 className="font-display font-semibold text-lg text-white">Queue is clear!</h3>
          <p className="text-gray-500 text-sm mt-1">There are no pending salon registration requests requiring approval at this time.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {shops.map((shop) => (
            <div key={shop.id} className="card p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
              {/* Shop Details */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display font-bold text-xl text-white">{shop.name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {shop.category}
                    </span>
                  </div>
                  {shop.description && (
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">{shop.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Location */}
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-brand-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="text-sm text-gray-300 mt-0.5 leading-snug">
                        {shop.address}, {shop.city}, {shop.district}, {shop.state} - {shop.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-2.5">
                    <Clock size={16} className="text-brand-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Timings & Operating Days</p>
                      <p className="text-sm text-gray-300 mt-0.5">
                        {shop.openTime} - {shop.closeTime}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {shop.workingDays.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Owner info */}
                <div className="p-4 bg-surface rounded-xl border border-surface-border mt-2">
                  <p className="text-xs text-gray-400 font-semibold mb-2">PARTNER OWNER CONTACT</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="text-sm text-gray-300 font-medium">{shop.owner.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Mail size={12} className="text-gray-500" />
                      <span>{shop.owner.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Phone size={12} className="text-gray-500" />
                      <span>{shop.owner.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions & Media Panel */}
              <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-surface-border pt-6 lg:pt-0 lg:pl-6 space-y-4">
                <div className="relative aspect-video rounded-xl bg-surface overflow-hidden border border-surface-border">
                  {shop.coverImage ? (
                    <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                      <span className="text-3xl mb-1">🏪</span>
                      <span className="text-xs">No cover image uploaded</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(shop.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-2"
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button
                    onClick={() => setRejectId(shop.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="btn-outline border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 flex-1 flex items-center justify-center gap-2 py-2"
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRejectId(null)} />
          <div className="relative card p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-semibold text-lg text-white mb-2">Reject Salon Listing</h3>
            <p className="text-xs text-gray-500 mb-4">Provide a clear explanation for the rejection. This reason will be emailed to the partner owner.</p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="label">Rejection Reason *</label>
                <textarea
                  className="input min-h-[100px] resize-none"
                  placeholder="e.g. Invalid shop address proof, profile details mismatch, incorrect service categories."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="btn-primary bg-red-500 hover:bg-red-600 text-white flex-1"
                >
                  {rejectMutation.isPending ? "Submitting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
