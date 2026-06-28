import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/AdminLayout";
import { api } from "../lib/api";
import { STATES, STATES_AND_DISTRICTS } from "../lib/locationData";
import { Store, User, Scissors, Calendar, Check, Trash2, Edit, Plus, ArrowLeft, Image as ImageIcon, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

interface Shop {
  id: string;
  name: string;
  description?: string;
  category: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  openTime: string;
  closeTime: string;
  workingDays: string[];
  coverImage?: string;
  images?: string[];
}

interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  customCategoryName?: string;
  price: number;
  durationMins: number;
  isActive: boolean;
}

interface Staff {
  id: string;
  name: string;
  specialization?: string;
  experience?: string;
  bio?: string;
  isActive: boolean;
}

const CATEGORIES = ["MALE", "FEMALE", "UNISEX"];
const SERVICE_CATEGORIES = ["HAIRCUT", "BEARD", "FACIAL", "MASSAGE", "HAIR_COLOR", "HAIR_SPA", "WAXING", "KERATIN", "STRAIGHTENING", "OTHER"];
const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function ManageShopPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "gallery" | "services" | "staff">("profile");

  // State for forms
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Gallery state (10 slots)
  const [galleryImages, setGalleryImages] = useState<string[]>(Array(10).fill(""));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Queries
  const { data: shop, isLoading: loadingShop } = useQuery<Shop>({
    queryKey: ["admin-manage-shop", id],
    queryFn: () => api.getShopForAdmin(id!),
    enabled: !!id,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery<Service[]>({
    queryKey: ["admin-manage-services", id],
    queryFn: () => api.getServicesForAdmin(id!),
    enabled: !!id,
  });

  const { data: staff = [], isLoading: loadingStaff } = useQuery<Staff[]>({
    queryKey: ["admin-manage-staff", id],
    queryFn: () => api.getStaffForAdmin(id!),
    enabled: !!id,
  });

  // Initialize gallery state from shop details
  useEffect(() => {
    if (shop) {
      const initialImages: string[] = [];
      if (shop.coverImage) initialImages.push(shop.coverImage);
      if (shop.images && Array.isArray(shop.images)) {
        initialImages.push(...shop.images);
      }
      while (initialImages.length < 10) {
        initialImages.push("");
      }
      setGalleryImages(initialImages);
    }
  }, [shop]);

  // Mutations
  const updateShopMutation = useMutation({
    mutationFn: (data: Partial<Shop>) => api.updateShopForAdmin(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manage-shop", id] });
      toast.success("Shop details updated successfully!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update shop"),
  });

  const addServiceMutation = useMutation({
    mutationFn: (data: any) => api.addServiceForAdmin({ ...data, shopId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manage-services", id] });
      toast.success("Service added successfully!");
      setShowAddService(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to add service"),
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ svcId, data }: { svcId: string; data: any }) => api.updateServiceForAdmin(svcId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manage-services", id] });
      toast.success("Service updated successfully!");
      setEditingService(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update service"),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (svcId: string) => api.deleteServiceForAdmin(svcId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manage-services", id] });
      toast.success("Service removed/deactivated successfully!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete service"),
  });

  const addStaffMutation = useMutation({
    mutationFn: (data: any) => api.addStaffForAdmin({ ...data, shopId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manage-staff", id] });
      toast.success("Staff member added successfully!");
      setShowAddStaff(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to add staff member"),
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: any }) => api.updateStaffForAdmin(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manage-staff", id] });
      toast.success("Staff member updated successfully!");
      setEditingStaff(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update staff member"),
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (staffId: string) => api.deleteStaffForAdmin(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manage-staff", id] });
      toast.success("Staff member deleted successfully!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete staff"),
  });

  // Handle Forms Submit
  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const workingDays = DAYS_OF_WEEK.filter((day) => formData.get(`day-${day}`) === "true");

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      openTime: formData.get("openTime") as string,
      closeTime: formData.get("closeTime") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      district: formData.get("district") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      workingDays,
    };

    updateShopMutation.mutate(data);
  };

  const handleAddServiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("svcName") as string,
      description: formData.get("svcDescription") as string,
      category: formData.get("svcCategory") as string,
      customCategoryName: formData.get("svcCategory") === "OTHER" ? (formData.get("svcCustomCategory") as string) : undefined,
      price: Math.round(Number(formData.get("svcPrice")) * 100), // convert Rs to paise
      durationMins: Number(formData.get("svcDuration")),
      isActive: true,
    };
    addServiceMutation.mutate(data);
  };

  const handleEditServiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingService) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("svcName") as string,
      description: formData.get("svcDescription") as string,
      category: formData.get("svcCategory") as string,
      customCategoryName: formData.get("svcCategory") === "OTHER" ? (formData.get("svcCustomCategory") as string) : undefined,
      price: Math.round(Number(formData.get("svcPrice")) * 100),
      durationMins: Number(formData.get("svcDuration")),
      isActive: formData.get("svcActive") === "true",
    };
    updateServiceMutation.mutate({ svcId: editingService.id, data });
  };

  const handleAddStaffSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("staffName") as string,
      specialization: formData.get("staffSpecialization") as string,
      experience: formData.get("staffExperience") as string,
      bio: formData.get("staffBio") as string,
    };
    addStaffMutation.mutate(data);
  };

  const handleEditStaffSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStaff) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("staffName") as string,
      specialization: formData.get("staffSpecialization") as string,
      experience: formData.get("staffExperience") as string,
      bio: formData.get("staffBio") as string,
      isActive: formData.get("staffActive") === "true",
    };
    updateStaffMutation.mutate({ staffId: editingStaff.id, data });
  };

  // Image Upload handler
  const handleUploadImageClick = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const path = `shops/${id}/gallery_${index}_${Date.now()}`;
      const url = await api.uploadFile(file, "shop-images", path);
      
      setGalleryImages((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
      toast.success(`Photo #${index + 1} uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploadingIndex(null);
    }
    
    e.target.value = '';
  };

  const handleRemoveImageClick = (index: number) => {
    setGalleryImages((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  const handleSaveGallery = () => {
    // Compact empty slots to keep photos sequential
    const activeUrls = galleryImages.filter((url) => url !== "");

    if (activeUrls.length < 2) {
      toast.error("You must upload at least 2 photos (the Cover Image and at least one secondary photo) before saving.");
      return;
    }

    // Set first image as coverImage, rest as images array
    const data = {
      coverImage: activeUrls[0],
      images: activeUrls.slice(1),
    };

    updateShopMutation.mutate(data);
  };

  // State-district linkage inside form
  const [formState, setFormState] = useState("");
  const formDistricts = STATES_AND_DISTRICTS[formState] ?? [];

  // Update formState once shop loads
  useState(() => {
    if (shop?.state) {
      setFormState(shop.state);
    }
  });

  const handleFormStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormState(e.target.value);
  };

  if (loadingShop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Store size={48} className="mx-auto mb-4 text-gray-600" />
        <p className="font-semibold text-white">Shop not found</p>
        <Link to="/shops" className="text-brand-400 mt-2 hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Salons
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/shops" className="p-2 border border-surface-border hover:bg-surface/30 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <PageHeader
          title={`Configure ${shop.name}`}
          subtitle={`Admin direct control panel to edit settings, gallery, services, and staff for ${shop.name}.`}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border">
        {(["profile", "gallery", "services", "staff"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 font-bold text-sm border-b-2 capitalize transition-colors ${
              activeTab === tab
                ? "border-brand-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="card p-6 space-y-6">
          <h3 className="font-bold text-base text-white border-b border-surface-border pb-3 flex items-center gap-2">
            <Store size={18} className="text-brand-400" /> General Shop Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Salon Name</label>
              <input name="name" defaultValue={shop.name} className="input w-full py-2 text-sm" required />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Category</label>
              <select name="category" defaultValue={shop.category} className="input w-full py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 block mb-1">Description</label>
              <textarea name="description" defaultValue={shop.description ?? ""} className="input w-full py-2 text-sm h-24 resize-none" />
            </div>

            {/* Timings */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Opening Time (24h)</label>
              <input name="openTime" type="time" defaultValue={shop.openTime} className="input w-full py-2 text-sm" required />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Closing Time (24h)</label>
              <input name="closeTime" type="time" defaultValue={shop.closeTime} className="input w-full py-2 text-sm" required />
            </div>
          </div>

          <h3 className="font-bold text-base text-white border-b border-surface-border pt-4 pb-3 flex items-center gap-2">
            <Calendar size={18} className="text-brand-400" /> Location Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* State */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">State</label>
              <select
                name="state"
                value={formState || shop.state}
                onChange={handleFormStateChange}
                className="input w-full py-2 text-sm"
              >
                <option value="">Select State</option>
                {STATES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">District</label>
              <select
                name="district"
                defaultValue={shop.district}
                className="input w-full py-2 text-sm"
              >
                <option value="">Select District</option>
                {formDistricts.map((dst) => <option key={dst} value={dst}>{dst}</option>)}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">City</label>
              <input name="city" defaultValue={shop.city} className="input w-full py-2 text-sm" required />
            </div>

            {/* Pincode */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Pincode</label>
              <input name="pincode" defaultValue={shop.pincode} className="input w-full py-2 text-sm" required />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 block mb-1">Full Address</label>
              <input name="address" defaultValue={shop.address} className="input w-full py-2 text-sm" required />
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-3">Operating Days</label>
            <div className="flex flex-wrap gap-4">
              {DAYS_OF_WEEK.map((day) => {
                const isChecked = shop.workingDays.includes(day);
                return (
                  <label key={day} className="flex items-center gap-2 text-sm text-gray-300 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      name={`day-${day}`}
                      defaultChecked={isChecked}
                      value="true"
                      className="rounded border-surface-border text-brand-500 focus:ring-brand-500/20 bg-surface"
                    />
                    {day}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-surface-border pt-6">
            <button
              type="submit"
              disabled={updateShopMutation.isPending}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check size={16} /> Save Settings
            </button>
          </div>
        </form>
      )}

      {/* Gallery Tab */}
      {activeTab === "gallery" && (
        <div className="card p-6 space-y-6">
          <h3 className="font-bold text-base text-white border-b border-surface-border pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ImageIcon size={18} className="text-brand-400" /> Salon Media Gallery
            </span>
            <span className="text-xs text-gray-400 font-normal">
              Minimum 2 photos, Maximum 10 photos
            </span>
          </h3>

          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Upload pictures of your salon interior, exterior, or styling results. 
            <strong> Photo #1</strong> will automatically be set as the <strong>Cover Image</strong> displayed on the customer web portal.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {galleryImages.map((imageUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-square border border-surface-border bg-surface rounded-xl overflow-hidden group flex flex-col items-center justify-center transition-all hover:border-brand-500"
              >
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt={`Gallery #${idx + 1}`} className="w-full h-full object-cover" />
                    
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-surface-border/40">
                      {idx === 0 ? "1 (Cover)" : idx + 1}
                    </div>

                    <button
                      onClick={() => handleRemoveImageClick(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove Photo"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 text-center hover:bg-surface/40 select-none">
                    {uploadingIndex === idx ? (
                      <div className="w-6 h-6 border-2 border-surface-border border-t-brand-500 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={18} className="text-gray-500 mb-1.5" />
                        <span className="text-[10px] font-bold text-gray-400">Photo #{idx + 1}</span>
                        {idx === 0 && <span className="text-[8px] text-brand-400 mt-0.5">(Cover Image)</span>}
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

          <div className="flex justify-end gap-3 border-t border-surface-border pt-6 mt-4">
            <button
              onClick={handleSaveGallery}
              disabled={updateShopMutation.isPending || uploadingIndex !== null}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check size={16} /> Save Gallery
            </button>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Scissors size={18} className="text-brand-400" /> Salon Services
            </h3>
            <button
              onClick={() => {
                setEditingService(null);
                setShowAddService(true);
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-3.5 py-2 rounded-lg font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus size={14} /> Add Service
            </button>
          </div>

          {/* Add/Edit Forms */}
          {(showAddService || editingService) && (
            <form
              onSubmit={editingService ? handleEditServiceSubmit : handleAddServiceSubmit}
              className="card p-5 border border-surface-border/60 bg-surface/40 space-y-4"
            >
              <h4 className="font-bold text-sm text-white">
                {editingService ? `Edit Service: ${editingService.name}` : "Create New Service"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Service Name</label>
                  <input name="svcName" defaultValue={editingService?.name ?? ""} className="input w-full py-1.5 text-xs" required placeholder="e.g. Hair Cut" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Category</label>
                  <select name="svcCategory" defaultValue={editingService?.category ?? "HAIRCUT"} className="input w-full py-1.5 text-xs">
                    {SERVICE_CATEGORIES.map((sc) => <option key={sc} value={sc}>{sc.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Custom Category Name (If Other)</label>
                  <input name="svcCustomCategory" defaultValue={editingService?.customCategoryName ?? ""} className="input w-full py-1.5 text-xs" placeholder="e.g. Laser Treatment" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Price (in ₹)</label>
                  <input name="svcPrice" type="number" step="0.01" defaultValue={editingService ? (editingService.price / 100).toFixed(2) : ""} className="input w-full py-1.5 text-xs" required placeholder="e.g. 150" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Duration (Mins)</label>
                  <input name="svcDuration" type="number" defaultValue={editingService?.durationMins ?? ""} className="input w-full py-1.5 text-xs" required placeholder="e.g. 30" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Description (Optional)</label>
                  <input name="svcDescription" defaultValue={editingService?.description ?? ""} className="input w-full py-1.5 text-xs" placeholder="Describe the treatment..." />
                </div>
                {editingService && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Active Status</label>
                    <select name="svcActive" defaultValue={String(editingService.isActive)} className="input w-full py-1.5 text-xs">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddService(false);
                    setEditingService(null);
                  }}
                  className="bg-transparent text-gray-400 border border-surface-border text-xs px-4 py-2 rounded-lg hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-4 py-2 rounded-lg font-bold"
                >
                  Save Service
                </button>
              </div>
            </form>
          )}

          {/* List of Services */}
          <div className="card overflow-hidden">
            {loadingServices ? (
              <div className="p-8 text-center"><div className="w-6 h-6 border border-t-brand-500 rounded-full animate-spin mx-auto" /></div>
            ) : services.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No services created for this shop yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface/50 border-b border-surface-border text-gray-400 text-xs font-semibold uppercase">
                      <th className="p-3 pl-5">Service Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-sm text-gray-300">
                    {services.map((svc) => (
                      <tr key={svc.id} className="hover:bg-surface/10 transition-colors">
                        <td className="p-3 pl-5">
                          <div className="font-semibold text-white">{svc.name}</div>
                          {svc.description && <div className="text-xs text-gray-500 mt-0.5">{svc.description}</div>}
                        </td>
                        <td className="p-3 text-xs">{svc.category === "OTHER" && svc.customCategoryName ? svc.customCategoryName : svc.category.replace("_", " ")}</td>
                        <td className="p-3 font-semibold text-white">₹{(svc.price / 100).toFixed(2)}</td>
                        <td className="p-3 text-xs">{svc.durationMins} mins</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${svc.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                            {svc.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="p-3 pr-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setShowAddService(false);
                                setEditingService(svc);
                              }}
                              className="p-1 hover:bg-surface/30 rounded text-gray-400 hover:text-white"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to deactivate/delete this service?")) {
                                  deleteServiceMutation.mutate(svc.id);
                                }
                              }}
                              className="p-1 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <User size={18} className="text-brand-400" /> Stylists & Staff
            </h3>
            <button
              onClick={() => {
                setEditingStaff(null);
                setShowAddStaff(true);
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-3.5 py-2 rounded-lg font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus size={14} /> Add Stylist
            </button>
          </div>

          {/* Add/Edit Staff Forms */}
          {(showAddStaff || editingStaff) && (
            <form
              onSubmit={editingStaff ? handleEditStaffSubmit : handleAddStaffSubmit}
              className="card p-5 border border-surface-border/60 bg-surface/40 space-y-4"
            >
              <h4 className="font-bold text-sm text-white">
                {editingStaff ? `Edit Stylist: ${editingStaff.name}` : "Create New Stylist"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Name</label>
                  <input name="staffName" defaultValue={editingStaff?.name ?? ""} className="input w-full py-1.5 text-xs" required placeholder="e.g. Ramesh Kumar" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Specialization</label>
                  <input name="staffSpecialization" defaultValue={editingStaff?.specialization ?? ""} className="input w-full py-1.5 text-xs" placeholder="e.g. Hair Specialist" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Experience</label>
                  <input name="staffExperience" defaultValue={editingStaff?.experience ?? ""} className="input w-full py-1.5 text-xs" placeholder="e.g. 5 Years" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Bio (Optional)</label>
                  <input name="staffBio" defaultValue={editingStaff?.bio ?? ""} className="input w-full py-1.5 text-xs" placeholder="A brief description of their experience..." />
                </div>
                {editingStaff && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Active Status</label>
                    <select name="staffActive" defaultValue={String(editingStaff.isActive)} className="input w-full py-1.5 text-xs">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaff(false);
                    setEditingStaff(null);
                  }}
                  className="bg-transparent text-gray-400 border border-surface-border text-xs px-4 py-2 rounded-lg hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-4 py-2 rounded-lg font-bold"
                >
                  Save Stylist
                </button>
              </div>
            </form>
          )}

          {/* List of Staff */}
          <div className="card overflow-hidden">
            {loadingStaff ? (
              <div className="p-8 text-center"><div className="w-6 h-6 border border-t-brand-500 rounded-full animate-spin mx-auto" /></div>
            ) : staff.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No staff members created for this shop yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface/50 border-b border-surface-border text-gray-400 text-xs font-semibold uppercase">
                      <th className="p-3 pl-5">Name</th>
                      <th className="p-3">Speciality</th>
                      <th className="p-3">Experience</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-sm text-gray-300">
                    {staff.map((st) => (
                      <tr key={st.id} className="hover:bg-surface/10 transition-colors">
                        <td className="p-3 pl-5">
                          <div className="font-semibold text-white">{st.name}</div>
                          {st.bio && <div className="text-xs text-gray-500 mt-0.5">{st.bio}</div>}
                        </td>
                        <td className="p-3 text-xs">{st.specialization || "Generalist"}</td>
                        <td className="p-3 text-xs">{st.experience || "N/A"}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                            {st.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="p-3 pr-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setShowAddStaff(false);
                                setEditingStaff(st);
                              }}
                              className="p-1 hover:bg-surface/30 rounded text-gray-400 hover:text-white"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this staff member?")) {
                                  deleteStaffMutation.mutate(st.id);
                                }
                              }}
                              className="p-1 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
