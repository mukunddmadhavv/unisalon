import { supabase } from "./supabase";

const API = import.meta.env.VITE_API_URL as string;

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export const api = {
  // ── Owner: Shop ──────────────────────────────────────────
  createShop: (data: unknown) => request("/api/owner/shops", { method: "POST", body: JSON.stringify(data) }),
  updateShop: (id: string, data: unknown) => request(`/api/owner/shops/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // ── Owner: Staff ─────────────────────────────────────────
  createStaff: (data: unknown) => request("/api/owner/staff", { method: "POST", body: JSON.stringify(data) }),
  updateStaff: (id: string, data: unknown) => request(`/api/owner/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStaff: (id: string) => request(`/api/owner/staff/${id}`, { method: "DELETE" }),

  // ── Owner: Services ──────────────────────────────────────
  createService: (data: unknown) => request("/api/owner/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: string, data: unknown) => request(`/api/owner/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id: string) => request(`/api/owner/services/${id}`, { method: "DELETE" }),

  // ── Owner: Bookings ───────────────────────────────────────
  getOwnerBookings: (params?: { date?: string; status?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/owner/bookings${q ? `?${q}` : ""}`);
  },
  updateBookingStatus: (id: string, status: string) =>
    request(`/api/owner/bookings/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  // ── Owner: Notifications ──────────────────────────────────
  getNotifications: () => request("/api/owner/notifications"),
  markNotificationsRead: () => request("/api/owner/notifications/read", { method: "PUT" }),

  // ── Public ───────────────────────────────────────────────
  getShopBySlug: (slug: string) => request(`/api/shops/${slug}`),

  // ── Upload to Supabase Storage ────────────────────────────
  async uploadFile(file: File, bucket: string, path: string): Promise<string> {
    const { error, data } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) throw error;
    const { data: url } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return url.publicUrl;
  },
};
