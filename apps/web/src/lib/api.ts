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
  // ── Public: Shops & Geolocation ────────────────────────────────────
  getShops: (params?: { category?: string; search?: string; city?: string; district?: string; lat?: string; lng?: string; radius?: string; page?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<any>(`/api/shops${q ? `?${q}` : ""}`);
  },
  getShopBySlug: (slug: string) => request<any>(`/api/shops/${slug}`),
  getDistricts: () => request<string[]>("/api/districts"),

  // ── Public: On-the-fly Slot availability ──────────────────────────
  getShopSlots: (shopId: string, params: { date: string; serviceIds: string }) => {
    const q = new URLSearchParams(params).toString();
    return request<any>(`/api/shops/${shopId}/slots?${q}`);
  },

  // ── Customer: Slot holds (BookMyShow) ─────────────────────────────
  createSlotHold: (data: { shopId: string; staffId?: string; date: string; startTime: string; serviceIds: string[] }) =>
    request<any>("/api/slots/hold", { method: "POST", body: JSON.stringify(data) }),
  releaseSlotHold: (holdId: string) =>
    request<any>(`/api/slots/hold/${holdId}`, { method: "DELETE" }),
  getSlotHold: (holdId: string) =>
    request<any>(`/api/slots/hold/${holdId}`),

  // ── Customer: Bookings & Reviews ──────────────────────────────────
  createBooking: (data: { holdId: string; notes?: string }) =>
    request<any>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
  getMyBookings: () =>
    request<any>("/api/bookings/me"),
  cancelBooking: (id: string) =>
    request<any>(`/api/bookings/${id}/cancel`, { method: "PUT" }),
  postReview: (data: { shopId: string; rating: number; comment?: string }) =>
    request<any>("/api/reviews", { method: "POST", body: JSON.stringify(data) }),
};
