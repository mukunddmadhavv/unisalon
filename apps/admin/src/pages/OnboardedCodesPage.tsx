import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/AdminLayout";
import { api } from "../lib/api";
import { format } from "date-fns";
import { Key, Copy, CheckCircle, Clock, Mail, Phone, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface OnboardedCodeItem {
  logId: string;
  createdAt: string;
  claimCode: string;
  isClaimed: boolean;
  shop: {
    id: string;
    name: string;
    category: string;
    city: string;
    district: string;
    status: string;
    owner: {
      name: string;
      email: string;
      phone: string;
    };
  } | null;
}

export default function OnboardedCodesPage() {
  const { data: items = [], isLoading } = useQuery<OnboardedCodeItem[]>({
    queryKey: ["onboarded-codes"],
    queryFn: () => api.getOnboardedCodes(),
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied claim code: ${code}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarded Invite Codes"
        subtitle="Manage invitations issued for pre-onboarded salons. Check which owners have successfully linked their accounts."
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Key size={36} className="mx-auto mb-3 text-gray-600" />
            <p className="font-medium text-white">No onboarding codes found</p>
            <p className="text-sm mt-1">Start by onboarding a partner salon to generate invite codes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface/50 text-gray-400 text-xs font-semibold uppercase">
                  <th className="p-4 pl-6">Salon Details</th>
                  <th className="p-4">Invitation Code</th>
                  <th className="p-4">Owner Contact</th>
                  <th className="p-4">Created On</th>
                  <th className="p-4">Link Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {items.map((item) => (
                  <tr key={item.logId} className="hover:bg-surface/20 transition-colors text-sm text-gray-300">
                    {/* Salon details */}
                    <td className="p-4 pl-6">
                      {item.shop ? (
                        <>
                          <div className="font-semibold text-white">{item.shop.name}</div>
                          <div className="text-xs text-brand-400 mt-0.5">{item.shop.category} • {item.shop.city}</div>
                        </>
                      ) : (
                        <div className="text-gray-500 italic">Deleted Shop</div>
                      )}
                    </td>

                    {/* Claim Code */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-headline font-bold text-white bg-surface border border-surface-border px-2.5 py-1 rounded tracking-wider text-xs">
                          {item.claimCode}
                        </span>
                        <button
                          onClick={() => handleCopyCode(item.claimCode)}
                          className="p-1 hover:bg-surface/30 rounded text-gray-500 hover:text-white transition-colors"
                          title="Copy Code"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Owner Details */}
                    <td className="p-4">
                      {item.shop ? (
                        <>
                          <div className="font-medium text-white">{item.shop.owner.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-col gap-0.5">
                            <span className="flex items-center gap-1"><Mail size={10} /> {item.shop.owner.email}</span>
                            <span className="flex items-center gap-1"><Phone size={10} /> {item.shop.owner.phone}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">—</div>
                      )}
                    </td>

                    {/* Creation Date */}
                    <td className="p-4 text-xs text-gray-400">
                      {format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}
                    </td>

                    {/* Claim status badge */}
                    <td className="p-4">
                      {item.isClaimed ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/25 inline-flex items-center gap-1">
                          <CheckCircle size={10} /> CLAIMED & LINKED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/25 inline-flex items-center gap-1">
                          <Clock size={10} /> UNCLAIMED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      {item.shop && (
                        <Link
                          to={`/shops/${item.shop.id}/manage`}
                          className="bg-brand-500 hover:bg-brand-600 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-sm transition-all inline-flex items-center gap-1"
                        >
                          Configure <ExternalLink size={11} />
                        </Link>
                      )}
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
