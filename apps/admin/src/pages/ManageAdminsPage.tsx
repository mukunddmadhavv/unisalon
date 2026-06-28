import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { PageHeader } from "../components/AdminLayout";
import { Mail, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await api.getAdmins();
      setAdmins(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    try {
      setAdding(true);
      await api.addAdmin(newEmail);
      toast.success("Admin added successfully");
      setNewEmail("");
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to add admin");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from admins?`)) return;
    
    try {
      setRemoving(email);
      await api.removeAdmin(email);
      toast.success("Admin removed successfully");
      fetchAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove admin");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader 
        title="Manage Admins" 
        subtitle="Authorize additional Gmail addresses to access this admin portal."
      />

      {/* Add Admin Form */}
      <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #e4ebf3", marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} /> Add New Admin
        </h2>
        <form onSubmit={handleAddAdmin} style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: 16, top: 14, color: "#a0aec0" }} />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="colleague@gmail.com"
              required
              style={{
                width: "100%", padding: "12px 16px 12px 42px", borderRadius: 10,
                border: "1px solid #e4ebf3", fontSize: 14, outline: "none"
              }}
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newEmail.trim()}
            style={{
              padding: "0 24px", background: "#111111", color: "#fff", borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: (adding || !newEmail.trim()) ? "not-allowed" : "pointer",
              opacity: (adding || !newEmail.trim()) ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, border: "none"
            }}
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : "Authorize Email"}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 16, borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Admins List */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e4ebf3", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e4ebf3" }}>
            <tr>
              <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</th>
              <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Added By</th>
              <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</th>
              <th style={{ padding: "16px 24px", textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  No authorized admins found.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.email} style={{ borderBottom: "1px solid #e4ebf3" }}>
                  <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600 }}>{admin.email}</td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#64748b" }}>{admin.addedBy || "-"}</td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#64748b" }}>
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      disabled={removing === admin.email}
                      style={{
                        background: "none", border: "none", color: "#ef4444", cursor: removing === admin.email ? "not-allowed" : "pointer",
                        padding: 8, borderRadius: 8, display: "inline-flex", alignItems: "center", opacity: removing === admin.email ? 0.5 : 1
                      }}
                      title="Revoke Access"
                    >
                      {removing === admin.email ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
