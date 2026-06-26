import { X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const handleOpen = () => {
    setOpen(true);
    if (unreadCount > 0) markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="hover:bg-surface-container rounded-full p-2 transition-all active:scale-95 duration-100 relative flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-[24px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-white" />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-50 w-80 bg-white border border-surface-border rounded-xl shadow-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
              <h3 className="font-display font-semibold text-sm text-on-surface">Notifications</h3>
              <button onClick={() => setOpen(false)} className="hover:bg-surface-container p-1 rounded-full">
                <X size={14} className="text-on-surface-variant" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-surface-border last:border-0 hover:bg-surface-container-low transition-colors ${
                      !n.isRead ? "bg-secondary-container/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface leading-tight">{n.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[10px] text-on-surface-variant opacity-60 mt-1">
                          {format(new Date(n.createdAt), "dd MMM, hh:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
