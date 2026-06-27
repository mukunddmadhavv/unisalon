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
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
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
