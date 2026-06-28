import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/AdminLayout";
import { api } from "../lib/api";
import { Search, Filter, ChevronLeft, ChevronRight, Store, Mail, Phone, Calendar, Plus, X, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { STATES, STATES_AND_DISTRICTS } from "../lib/locationData";
import toast from "react-hot-toast";

interface Shop {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  city: string;
  district: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  _count: {
    services: number;
    staff: number;
    bookings: number;
  };
}

const CATEGORIES = ["ALL", "MALE", "FEMALE", "UNISEX"];

export default function ShopsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("APPROVED");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);

  // Onboard modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [onboardState, setOnboardState] = useState("");

  const formDistricts = STATES_AND_DISTRICTS[onboardState] ?? [];

  const { data: response, isLoading } = useQuery<{ shops: Shop[]; total: number; page: number }>({
    queryKey: ["admin-shops", search, status, category, page],
    queryFn: () =>
      api.getShops({
        search: search.trim() || undefined,
        status: status !== "ALL" ? status : undefined,
        category: category !== "ALL" ? category : undefined,
        page: String(page),
      }),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.suspendShop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shops"] });
      toast.success("Shop suspended/paused successfully.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to suspend shop"),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.approveShop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shops"] });
      toast.success("Shop activated/resumed successfully.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to resume shop"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteShop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shops"] });
      toast.success("Shop deleted permanently.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete shop"),
  });

  const onboardMutation = useMutation({
    mutationFn: (data: any) => api.onboardShop(data),
    onSuccess: (res) => {
      setGeneratedCode(res.claimCode);
      setOnboardSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["admin-shops"] });
      toast.success("Salon onboarded successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to onboard salon");
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOnboardState(e.target.value);
  };

  const handleOnboardSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      ownerName: formData.get("ownerName") as string,
      ownerEmail: (formData.get("ownerEmail") as string) || undefined,
      ownerPhone: formData.get("ownerPhone") as string,
      salonName: formData.get("salonName") as string,
      category: formData.get("salonCategory") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      district: formData.get("district") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
    };
    onboardMutation.mutate(data);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Activation code copied!");
  };

  const shops = response?.shops ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));



  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Salons"
        subtitle="Browse through all salon listings currently live and available to customers on the UniSalon platform."
        actions={
          <button
            onClick={() => {
              setOnboardSuccess(false);
              setOnboardState("");
              setShowOnboardModal(true);
            }}
            className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-4 py-2.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus size={14} /> Onboard Salon
          </button>
        }
      />

      {/* Filters Panel */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-4 bg-white border border-surface-border">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9 py-2 text-sm bg-white border border-surface-border text-gray-900"
            placeholder="Search shops by name..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter size={14} className="text-gray-500" />
          <select className="input py-2 text-sm w-full md:w-40 bg-white border border-surface-border text-gray-900" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="APPROVED">Live on Web</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUSPENDED">Paused</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All Registered</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter size={14} className="text-gray-500" />
          <select className="input py-2 text-sm w-full md:w-36 bg-white border border-surface-border text-gray-900" value={category} onChange={handleCategoryChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden bg-white border border-surface-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : shops.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Store size={36} className="mx-auto mb-3 text-gray-400" />
            <p className="font-semibold text-gray-900 text-lg">No active shops found</p>
            <p className="text-sm mt-1 text-gray-500">Try modifying your search query or status filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Salon Details</th>
                  <th className="p-4">Owner Info</th>
                  <th className="p-4">Stats</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors text-sm text-gray-700">
                    {/* Name & Category */}
                    <td className="p-4 pl-6">
                      <div className="font-bold text-gray-900 text-base">{shop.name}</div>
                      <div className="text-xs text-brand-600 mt-1 font-semibold">{shop.category.replace("_", " ")}</div>
                    </td>

                    {/* Owner Details */}
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{shop.owner.name}</div>
                      <div className="text-xs text-gray-600 mt-1 flex flex-col gap-1">
                        <span className="flex items-center gap-1"><Mail size={12} className="text-gray-400" /> {shop.owner.email}</span>
                        <span className="flex items-center gap-1"><Phone size={12} className="text-gray-400" /> {shop.owner.phone}</span>
                      </div>
                    </td>

                    {/* Stats counts */}
                    <td className="p-4">
                      <div className="text-xs space-y-1 text-gray-600">
                        <div><span className="text-gray-500">Services:</span> <span className="font-bold text-gray-900">{shop._count.services}</span></div>
                        <div><span className="text-gray-500">Staff members:</span> <span className="font-bold text-gray-900">{shop._count.staff}</span></div>
                        <div><span className="text-gray-500">Bookings:</span> <span className="font-bold text-gray-900">{shop._count.bookings}</span></div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      <div className="text-gray-900 font-semibold">{shop.city}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{shop.district}</div>
                    </td>

                    {/* Creation date */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{format(new Date(shop.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {shop.status === "APPROVED" && (
                        <span className="badge badge-approved">
                          LIVE ON WEB
                        </span>
                      )}
                      {shop.status === "SUSPENDED" && (
                        <span className="badge badge-suspended">
                          PAUSED
                        </span>
                      )}
                      {shop.status === "PENDING" && (
                        <span className="badge badge-pending">
                          PENDING
                        </span>
                      )}
                      {shop.status === "REJECTED" && (
                        <span className="badge badge-rejected">
                          REJECTED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/shops/${shop.id}/manage`}
                          className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-sm transition-all"
                        >
                          Modify
                        </Link>

                        {shop.status === "APPROVED" && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to pause/suspend "${shop.name}"? It will no longer show up on the web portal.`)) {
                                suspendMutation.mutate(shop.id);
                              }
                            }}
                            disabled={suspendMutation.isPending}
                            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1.5 rounded-lg font-bold border border-yellow-200 transition-all disabled:opacity-50"
                          >
                            Pause
                          </button>
                        )}

                        {shop.status === "SUSPENDED" && (
                          <button
                            onClick={() => {
                              resumeMutation.mutate(shop.id);
                            }}
                            disabled={resumeMutation.isPending}
                            className="bg-green-50 hover:bg-green-100 text-green-800 text-xs px-2.5 py-1.5 rounded-lg font-bold border border-green-200 transition-all disabled:opacity-50"
                          >
                            Resume
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`⚠️ WARNING: Are you sure you want to permanently delete "${shop.name}"? All services, staff, logs, and bookings will be deleted forever.`)) {
                              deleteMutation.mutate(shop.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="bg-red-50 hover:bg-red-100 text-red-800 text-xs px-2.5 py-1.5 rounded-lg font-bold border border-red-200 transition-all disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Panel */}
        {total > 20 && (
          <div className="p-4 border-t border-surface-border flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-600">
              Showing <span className="font-semibold text-gray-900">{(page - 1) * 20 + 1}</span> to{" "}
              <span className="font-semibold text-gray-900">{Math.min(total, page * 20)}</span> of{" "}
              <span className="font-semibold text-gray-900">{total}</span> shops
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-surface-border text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:text-gray-600 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-700 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-surface-border text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:text-gray-600 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Onboard Salon Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-surface-border w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="font-bold text-lg text-gray-900">Onboard Partner Salon</h2>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {onboardSuccess ? (
              <div className="p-6 space-y-6 text-center">
                <div className="w-12 h-12 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 text-base">Salon Onboarded Successfully!</h3>
                  <p className="text-gray-500 text-xs px-6">
                    The salon is created in our database. Give this invitation activation code to the owner so they can claim their dashboard.
                  </p>
                </div>

                <div className="bg-gray-50 border border-surface-border rounded-lg p-4 flex items-center justify-between gap-4 max-w-sm mx-auto">
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Invitation Code</span>
                    <span className="font-sans font-black text-xl text-gray-900 tracking-widest">{generatedCode}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 border border-surface-border hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-850 transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <div className="pt-4 border-t border-surface-border flex justify-end">
                  <button
                    onClick={() => setShowOnboardModal(false)}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboardSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="font-bold text-xs text-gray-700 uppercase tracking-widest border-b border-surface-border pb-1">Owner Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Owner Name</label>
                      <input name="ownerName" className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border" required placeholder="e.g. Anil Sharma" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Owner Phone</label>
                      <input name="ownerPhone" className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border" required placeholder="10-digit number" pattern="[0-9]{10}" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Owner Email (Optional)</label>
                      <input name="ownerEmail" type="email" className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border" placeholder="e.g. sharma.salon@gmail.com" />
                    </div>
                  </div>

                  <h3 className="font-bold text-xs text-gray-700 uppercase tracking-widest border-b border-surface-border pt-2 pb-1">Salon Profile</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Salon Name</label>
                      <input name="salonName" className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border" required placeholder="e.g. Royal Hair Cut" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Category</label>
                      <select name="salonCategory" className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border">
                        <option value="UNISEX">UNISEX</option>
                        <option value="MALE">MALE</option>
                        <option value="FEMALE">FEMALE</option>
                      </select>
                    </div>
                  </div>

                  <h3 className="font-bold text-xs text-gray-700 uppercase tracking-widest border-b border-surface-border pt-2 pb-1">Salon Address</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">State</label>
                      <select
                        name="state"
                        value={onboardState}
                        onChange={handleStateChange}
                        className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border"
                        required
                      >
                        <option value="">Select State</option>
                        {STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">District</label>
                      <select
                        name="district"
                        className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border"
                        required
                      >
                        <option value="">Select District</option>
                        {formDistricts.map((dst) => <option key={dst} value={dst}>{dst}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">City</label>
                      <input name="city" className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border" required placeholder="e.g. Deoria" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Pincode</label>
                      <input name="pincode" className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border" required placeholder="6-digit pincode" pattern="[0-9]{6}" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Full Street Address</label>
                      <input name="address" className="input py-2 text-xs w-full bg-white text-gray-900 border border-surface-border" required placeholder="Building, Street, Landmark" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-surface-border mt-6">
                  <button
                    type="button"
                    onClick={() => setShowOnboardModal(false)}
                    className="bg-transparent text-gray-700 border border-surface-border text-xs px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={onboardMutation.isPending}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all"
                  >
                    {onboardMutation.isPending ? "Onboarding..." : "Generate Activation Code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
