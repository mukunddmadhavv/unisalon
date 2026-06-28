import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/AdminLayout";
import { api } from "../lib/api";
import { Search, Users, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  _count: {
    bookings: number;
    reviews: number;
  };
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery<UserData[]>({
    queryKey: ["admin-users", search, page],
    queryFn: () =>
      api.getUsers({
        search: search.trim() || undefined,
        page: String(page),
      }),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const users = response ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registered Users"
        subtitle="View and manage the directory of registered customers on the UniSalon platform."
      />

      {/* Search Filter */}
      <div className="card p-4 bg-white border border-surface-border">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9 py-2 text-sm bg-white text-gray-900 border border-surface-border"
            placeholder="Search users by name or email..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Users List Table */}
      <div className="card overflow-hidden bg-white border border-surface-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Users size={36} className="mx-auto mb-3 text-gray-400" />
            <p className="font-semibold text-gray-900 text-lg">No users found</p>
            <p className="text-sm mt-1 text-gray-500">Try modifying your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Customer Details</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Reservations</th>
                  <th className="p-4">Written Reviews</th>
                  <th className="p-4 pr-6">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors text-sm text-gray-700">
                    {/* Avatar & Name */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
                            {u.name[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">ID: {u.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-800">
                        <Mail size={13} className="text-gray-400" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <span className="text-gray-400"><Phone size={10} /></span>
                            <span>{u.phone}</span>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Bookings Count */}
                    <td className="p-4">
                      <span className="font-bold text-gray-900">{u._count.bookings}</span>
                      <span className="text-gray-500 text-xs"> bookings</span>
                    </td>

                    {/* Reviews Count */}
                    <td className="p-4">
                      <span className="font-bold text-gray-900">{u._count.reviews}</span>
                      <span className="text-gray-500 text-xs"> reviews</span>
                    </td>

                    {/* Joined Date */}
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{format(new Date(u.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
