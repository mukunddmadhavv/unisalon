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
};
