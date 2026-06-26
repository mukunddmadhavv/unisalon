import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/DashboardLayout";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface StaffMember {
  id: string;
  name: string;
  photoUrl?: string;
  specialization?: string;
  experience?: string;
  bio?: string;
  isActive: boolean;
  displayOrder: number;
}

interface StaffFormData {
  name: string;
  specialization: string;
  experience: string;
  bio: string;
}

interface StaffModalProps {
  shopId: string;
  member?: StaffMember | null;
  onClose: () => void;
}

function StaffModal({ shopId, member, onClose }: StaffModalProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(member?.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<StaffFormData>({
    name: member?.name ?? "",
    specialization: member?.specialization ?? "",
    experience: member?.experience ?? "",
    bio: member?.bio ?? "",
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      let photoUrl = member?.photoUrl;
      if (photoFile) {
        setUploading(true);
        const path = `staff/${shopId}/${Date.now()}-${photoFile.name}`;
        photoUrl = await api.uploadFile(photoFile, "shop-images", path);
        setUploading(false);
      }
      const payload = { shopId, ...data, ...(photoUrl ? { photoUrl } : {}) };
      return member ? api.updateStaff(member.id, payload) : api.createStaff(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success(member ? "Stylist profile updated!" : "Stylist added successfully!");
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save stylist"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
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
          {member ? "Edit Stylist Profile" : "Add Stylist"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-2xl border border-dashed border-surface-container-high hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden transition-all bg-surface-container relative group"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-outline-variant group-hover:text-primary">
                  <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                  <span className="text-[10px] font-bold block mt-1">Photo</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">Profile Image</p>
              <p className="text-xs text-on-surface-variant">Click to upload. JPG, PNG up to 5MB</p>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(""); setPhotoFile(null); }}
                  className="text-xs text-red-500 hover:text-red-400 font-bold mt-1"
                >
                  Remove photo
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </div>

          <div>
            <label className="label">Full Name *</label>
            <input
              className="input"
              placeholder="e.g. Arjun Sharma"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Specialization</label>
            <input
              className="input"
              placeholder="e.g. Hair Styling, Beard Trimming..."
              value={form.specialization}
              onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Years of Experience</label>
            <input
              className="input"
              placeholder="e.g. 5+ years"
              value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Short Bio (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="A brief tagline or statement about this stylist..."
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button
              type="submit"
              disabled={mutation.isPending || uploading}
              className="btn-primary flex-1 bg-primary hover:opacity-90 transition-all shadow-sm"
            >
              {mutation.isPending || uploading ? "Saving..." : member ? "Update" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [modal, setModal] = useState<{ open: boolean; member?: StaffMember | null }>({ open: false });
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

  // Fetch staff members
  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await api.getStaff() as any;
      return res.data ?? res;
    },
    enabled: !!SHOP_ID,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteStaff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Stylist profile removed successfully");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to remove stylist"),
  });

  return (
    <div className="animate-fade-in select-none">
      <PageHeader
        title="Stylists & Staff"
        subtitle="Manage your team members. Customers can pick their preferred stylist during booking."
        actions={
          <button
            onClick={() => {
              if (!SHOP_ID) {
                toast.error("Please set up your shop profile details first!");
                return;
              }
              setModal({ open: true, member: null });
            }}
            className="btn-primary flex items-center gap-2 bg-primary text-on-primary"
          >
            <span className="material-symbols-outlined text-[20px]">add</span> Add Stylist
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : !SHOP_ID ? (
        <div className="bento-card p-12 text-center bg-white rounded-xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-3">storefront</span>
          <p className="text-on-surface-variant font-bold text-base">Setup Profile Required</p>
          <p className="text-on-surface-variant opacity-60 text-sm mb-6 max-w-sm mx-auto">
            You must set up and save your shop profile before adding stylists.
          </p>
          <Link to="/shop/edit" className="btn-primary mx-auto">
            Go to Shop Profile
          </Link>
        </div>
      ) : staff.length === 0 ? (
        <div className="bento-card p-12 text-center bg-white rounded-xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-3">group</span>
          <p className="text-on-surface-variant font-bold text-base">No stylists yet</p>
          <p className="text-on-surface-variant opacity-60 text-sm mb-6">
            Add team members so customers can select them on the marketplace portal.
          </p>
          <button onClick={() => setModal({ open: true, member: null })} className="btn-primary mx-auto">
            Add first stylist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl p-5 border border-surface-container-high group hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between"
            >
              {/* Actions on hover */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setModal({ open: true, member })}
                  className="p-1.5 rounded-lg bg-surface hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all shadow-sm border border-surface-container-high"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to remove this staff member?")) {
                      deleteMutation.mutate(member.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-surface hover:bg-surface-container text-on-surface-variant hover:text-error transition-all shadow-sm border border-surface-container-high"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>

              {/* Photo & Basic Details */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="w-14 h-14 rounded-xl object-cover border border-surface-container-high shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary text-xl font-bold select-none">
                      {member.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-base text-on-surface truncate">{member.name}</h3>
                    {member.specialization ? (
                      <p className="font-sans text-xs text-secondary font-bold uppercase tracking-wider mt-0.5 truncate">{member.specialization}</p>
                    ) : (
                      <p className="font-sans text-[10px] text-on-surface-variant font-semibold mt-0.5">Stylist</p>
                    )}
                  </div>
                </div>

                {member.experience && (
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mb-3">
                    <span className="material-symbols-outlined text-sm text-secondary">work</span>
                    <span>{member.experience} experience</span>
                  </div>
                )}

                {member.bio && (
                  <p className="font-sans text-xs text-on-surface-variant leading-relaxed line-clamp-2 italic">
                    "{member.bio}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <StaffModal
          shopId={SHOP_ID}
          member={modal.member}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
