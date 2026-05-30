import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/AdminLayout";
import { api } from "../lib/api";
import { Filter, ChevronLeft, ChevronRight, Clipboard, Calendar } from "lucide-react";
import { format } from "date-fns";

interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata?: any;
  shop?: {
    name: string;
  };
}

const ACTIONS = ["ALL", "APPROVE_SHOP", "REJECT_SHOP"];

export default function LogsPage() {
  const [action, setAction] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery<AdminLog[]>({
    queryKey: ["admin-logs", action, page],
    queryFn: () =>
      api.getLogs({
        action: action !== "ALL" ? action : undefined,
        page: String(page),
      }),
  });

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAction(e.target.value);
    setPage(1);
  };

  const logs = response ?? [];

  const getActionBadge = (action: string) => {
    const badges: Record<string, string> = {
      APPROVE_SHOP: "bg-green-500/10 text-green-400 border-green-500/20",
      REJECT_SHOP: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badges[action] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
        {action.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Audit Logs"
        subtitle="Track system actions performed by administrative accounts on the UniSalon platform."
      />

      {/* Filter panel */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <span className="text-sm text-gray-400">Filter Action:</span>
          <select className="input py-1.5 px-3 text-xs w-44" value={action} onChange={handleActionChange}>
            {ACTIONS.map((act) => (
              <option key={act} value={act}>
                {act === "ALL" ? "All Actions" : act.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Clipboard size={36} className="mx-auto mb-3 text-gray-600" />
            <p className="font-medium text-white">No logs found</p>
            <p className="text-sm mt-1">There are no logged operations matching this filter query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface/50 text-gray-400 text-xs font-semibold uppercase">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Details</th>
                  <th className="p-4">Admin Auth UID</th>
                  <th className="p-4 pr-6">Metadata Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface/20 transition-colors text-sm text-gray-300">
                    {/* Timestamp */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-gray-600" />
                        <span>{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}</span>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="p-4">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Target Details */}
                    <td className="p-4">
                      {log.targetType === "SHOP" && log.shop ? (
                        <div>
                          <span className="text-gray-500 text-xs">Salon: </span>
                          <span className="font-semibold text-white">{log.shop.name}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-gray-500 text-xs">{log.targetType}: </span>
                          <span className="text-white font-medium">{log.targetId.substring(0, 12)}...</span>
                        </div>
                      )}
                    </td>

                    {/* Admin UID */}
                    <td className="p-4">
                      <code className="text-xs text-brand-400 bg-brand-500/5 px-2 py-0.5 rounded border border-brand-500/10">
                        {log.adminId.substring(0, 10)}...
                      </code>
                    </td>

                    {/* Metadata Context */}
                    <td className="p-4 pr-6">
                      {log.metadata && typeof log.metadata === "object" ? (
                        <div className="text-xs text-gray-400 space-y-0.5 max-w-sm">
                          {log.metadata.reason && (
                            <div>
                              <span className="font-semibold text-red-400/90">Reason: </span>
                              <span>"{log.metadata.reason}"</span>
                            </div>
                          )}
                          {!log.metadata.reason && (
                            <pre className="text-[10px] text-gray-500 overflow-x-auto">
                              {JSON.stringify(log.metadata)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Simple pagination */}
        {logs.length >= 30 && (
          <div className="p-4 border-t border-surface-border flex items-center justify-end gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-300">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < 30}
              className="p-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
