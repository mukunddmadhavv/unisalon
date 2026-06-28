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
  // ── Admin: Dashboard KPIs ──────────────────────────────────────────
  getStats: () => request<any>("/api/admin/stats"),

  // ── Admin: Shops Directory & Verification ──────────────────────────
  getShops: (params?: { status?: string; city?: string; district?: string; category?: string; search?: string; page?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/api/admin/shops${q ? `?${q}` : ""}`);
  },
  approveShop: (id: string) => request<any>(`/api/admin/shops/${id}/approve`, { method: "PUT" }),
  rejectShop: (id: string, reason: string) => request<any>(`/api/admin/shops/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) }),

  // ── Admin: Users Directory ─────────────────────────────────────────
  getUsers: (params?: { search?: string; page?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/api/admin/users${q ? `?${q}` : ""}`);
  },

  // ── Admin: System Logs ─────────────────────────────────────────────
  getLogs: (params?: { action?: string; page?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/api/admin/logs${q ? `?${q}` : ""}`);
  },

  // ── Admin: Onboard Shop ─────────────────────────────────────────────
  onboardShop: (data: any) => request<any>("/api/admin/shops/onboard", { method: "POST", body: JSON.stringify(data) }),

  // ── Admin: Shop/Owner Manage Proxy ──────────────────────────────────
  getShopForAdmin: (shopId: string) => request<any>(`/api/owner/shop?shopId=${shopId}`),
  updateShopForAdmin: (id: string, data: any) => request<any>(`/api/owner/shops/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  
  getStaffForAdmin: (shopId: string) => request<any>(`/api/owner/staff?shopId=${shopId}`),
  addStaffForAdmin: (data: any) => request<any>("/api/owner/staff", { method: "POST", body: JSON.stringify(data) }),
  updateStaffForAdmin: (id: string, data: any) => request<any>(`/api/owner/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStaffForAdmin: (id: string) => request<any>(`/api/owner/staff/${id}`, { method: "DELETE" }),

  getServicesForAdmin: (shopId: string) => request<any>(`/api/owner/services?shopId=${shopId}`),
  addServiceForAdmin: (data: any) => request<any>("/api/owner/services", { method: "POST", body: JSON.stringify(data) }),
  updateServiceForAdmin: (id: string, data: any) => request<any>(`/api/owner/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteServiceForAdmin: (id: string) => request<any>(`/api/owner/services/${id}`, { method: "DELETE" }),

  // ── Admin: Onboarded Invite Codes ───────────────────────────────
  getOnboardedCodes: () => request<any>("/api/admin/onboarded-codes"),

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
};
