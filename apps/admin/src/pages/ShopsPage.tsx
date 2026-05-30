import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/AdminLayout";
import { api } from "../lib/api";
import { Search, Filter, ChevronLeft, ChevronRight, Store, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Shop {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  city: string;
  district: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  _count: {
    services: number;
    staff: number;
    bookings: number;
  };
}

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];
const CATEGORIES = ["ALL", "MALE", "FEMALE", "UNISEX"];

export default function ShopsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery<{ shops: Shop[]; total: number; page: number }>({
    queryKey: ["admin-shops", search, status, category, page],
    queryFn: () =>
      api.getShops({
        search: search.trim() || undefined,
        status: status !== "ALL" ? status : undefined,
        category: category !== "ALL" ? category : undefined,
        page: String(page),
      }),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const shops = response?.shops ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
      SUSPENDED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    return (
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badges[status] ?? badges.PENDING}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Salons"
        subtitle="Manage and filter through all salon listings registered on the UniSalon platform."
      />

      {/* Filters Panel */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search shops by name..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter size={14} className="text-gray-500" />
          <select className="input py-2 text-sm w-full md:w-36" value={status} onChange={handleStatusChange}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter size={14} className="text-gray-500" />
          <select className="input py-2 text-sm w-full md:w-36" value={category} onChange={handleCategoryChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : shops.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Store size={36} className="mx-auto mb-3 text-gray-600" />
            <p className="font-medium text-white">No shops found</p>
            <p className="text-sm mt-1">Try modifying your search query or status filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface/50 text-gray-400 text-xs font-semibold uppercase">
                  <th className="p-4 pl-6">Salon Details</th>
                  <th className="p-4">Owner Info</th>
                  <th className="p-4">Stats</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-surface/20 transition-colors text-sm text-gray-300">
                    {/* Name & Category */}
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-white">{shop.name}</div>
                      <div className="text-xs text-brand-400 mt-0.5">{shop.category.replace("_", " ")}</div>
                    </td>

                    {/* Owner Details */}
                    <td className="p-4">
                      <div className="font-medium text-white">{shop.owner.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1"><Mail size={10} /> {shop.owner.email}</span>
                        <span className="flex items-center gap-1"><Phone size={10} /> {shop.owner.phone}</span>
                      </div>
                    </td>

                    {/* Stats counts */}
                    <td className="p-4">
                      <div className="text-xs space-y-1">
                        <div><span className="text-gray-400">Services:</span> <span className="font-semibold text-white">{shop._count.services}</span></div>
                        <div><span className="text-gray-400">Staff members:</span> <span className="font-semibold text-white">{shop._count.staff}</span></div>
                        <div><span className="text-gray-400">Bookings:</span> <span className="font-semibold text-white">{shop._count.bookings}</span></div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      <div className="text-white">{shop.city}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{shop.district}</div>
                    </td>

                    {/* Creation date */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Calendar size={13} className="text-gray-600" />
                        <span>{format(new Date(shop.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 pr-6 text-right">
                      {getStatusBadge(shop.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Panel */}
        {total > 20 && (
          <div className="p-4 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing <span className="font-medium text-white">{(page - 1) * 20 + 1}</span> to{" "}
              <span className="font-medium text-white">{Math.min(total, page * 20)}</span> of{" "}
              <span className="font-medium text-white">{total}</span> shops
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
