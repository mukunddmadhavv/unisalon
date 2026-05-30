import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, User, Briefcase, Pencil } from "lucide-react";
import { PageHeader } from "../components/DashboardLayout";
import { api } from "../lib/api";
import toast from "react-hot-toast";

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
      toast.success(member ? "Staff member updated" : "Staff member added!");
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
          {member ? "Edit Staff Member" : "Add Staff Member"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-surface-border hover:border-brand-500 cursor-pointer flex items-center justify-center overflow-hidden transition-colors group"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload size={18} className="mx-auto text-gray-600 group-hover:text-brand-400 transition-colors" />
                  <span className="text-[10px] text-gray-600 mt-1 block">Photo</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Profile Photo</p>
              <p className="text-xs text-gray-500">Click to upload. JPG, PNG up to 5MB</p>
              {photoPreview && (
                <button type="button" onClick={() => { setPhotoPreview(""); setPhotoFile(null); }}
                  className="text-xs text-red-400 hover:text-red-300 mt-1">Remove photo</button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </div>

          <div>
            <label className="label">Full name *</label>
            <input className="input" placeholder="Arjun Sharma" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>

          <div>
            <label className="label">Specialization</label>
            <input className="input" placeholder="Hair Styling, Beard Expert..." value={form.specialization}
              onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
          </div>

          <div>
            <label className="label">Experience</label>
            <input className="input" placeholder="3 years, 5+ years..." value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} />
          </div>

          <div>
            <label className="label">Bio (optional)</label>
            <textarea className="input resize-none" rows={2} placeholder="Short bio..."
              value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending || uploading} className="btn-primary flex-1">
              {mutation.isPending || uploading ? "Saving..." : member ? "Update" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [modal, setModal] = useState<{ open: boolean; member?: StaffMember | null }>({ open: false });
  const SHOP_ID = ""; // from ShopContext

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteStaff(id),
    onSuccess: () => {
      setStaff((prev) => prev.filter((s) => s.id !== modal.member?.id));
      toast.success("Staff member removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Add your barbers and stylists. Customers can pick their preferred staff."
        actions={
          <button onClick={() => setModal({ open: true, member: null })} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Member
          </button>
        }
      />

      {staff.length === 0 ? (
        <div className="card p-12 text-center">
          <User size={36} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No staff added yet</p>
          <p className="text-gray-600 text-sm mb-6">Add your team so customers can choose their preferred stylist</p>
          <button onClick={() => setModal({ open: true, member: null })} className="btn-primary mx-auto">
            Add first member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div key={member.id} className="card p-5 group relative overflow-hidden">
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setModal({ open: true, member })} className="p-1.5 rounded-lg bg-surface-card hover:bg-surface text-gray-400 hover:text-white transition-all">
                  <Pencil size={13} />
                </button>
                <button onClick={() => deleteMutation.mutate(member.id)} className="p-1.5 rounded-lg bg-surface-card hover:bg-surface text-gray-400 hover:text-red-400 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Photo */}
              <div className="flex items-center gap-4 mb-4">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-14 h-14 rounded-2xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 text-xl font-bold">
                    {member.name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">{member.name}</h3>
                  {member.specialization && (
                    <p className="text-xs text-brand-400 mt-0.5">{member.specialization}</p>
                  )}
                </div>
              </div>

              {member.experience && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <Briefcase size={11} />
                  <span>{member.experience} experience</span>
                </div>
              )}

              {member.bio && (
                <p className="text-xs text-gray-500 line-clamp-2">{member.bio}</p>
              )}
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
