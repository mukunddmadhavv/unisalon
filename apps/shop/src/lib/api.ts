const API = import.meta.env.VITE_API_URL as string;

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = (window as any).Clerk?.session
    ? await (window as any).Clerk.session.getToken()
    : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}


async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  
  if (!res.ok) {
    let errorMessage = `HTTP error! status: ${res.status}`;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const json = await res.json();
        errorMessage = json.error ?? errorMessage;
      } catch (_) {}
    } else {
      try {
        const text = await res.text();
        if (text) errorMessage = text;
      } catch (_) {}
    }
    throw new Error(errorMessage);
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Request failed");
    return json.data as T;
  }
  
  throw new Error("Response is not JSON");
}

export const api = {
  // ── Owner: Auth / Register ───────────────────────────────
  registerOwner: (data: { name: string; phone: string }) =>
    request("/api/owner/register", { method: "POST", body: JSON.stringify(data) }),

  // ── Owner: Shop ──────────────────────────────────────────
  getShop: () => request("/api/owner/shop"),
  createShop: (data: unknown) => request("/api/owner/shops", { method: "POST", body: JSON.stringify(data) }),
  updateShop: (id: string, data: unknown) => request(`/api/owner/shops/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // ── Owner: Staff ─────────────────────────────────────────
  getStaff: () => request("/api/owner/staff"),
  createStaff: (data: unknown) => request("/api/owner/staff", { method: "POST", body: JSON.stringify(data) }),
  updateStaff: (id: string, data: unknown) => request(`/api/owner/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStaff: (id: string) => request(`/api/owner/staff/${id}`, { method: "DELETE" }),

  // ── Owner: Services ──────────────────────────────────────
  getServices: () => request("/api/owner/services"),
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

  // ── Upload to Supabase Storage (via backend API to bypass RLS) ────
  async uploadFile(file: File, bucket: string, path: string): Promise<string> {
    const token = (window as any).Clerk?.session
      ? await (window as any).Clerk.session.getToken()
      : null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("path", path);

    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API}/api/owner/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error ?? "Failed to upload file to backend");
    }
    return json.data.url;
  },

  claimShop: (code: string) =>
    request("/api/owner/claim-shop", { method: "POST", body: JSON.stringify({ code }) }),
};
