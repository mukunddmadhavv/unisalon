import { Bell, X } from "lucide-react";
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
        className="relative p-2 rounded-xl hover:bg-surface-card transition-colors"
      >
        <Bell size={18} className="text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-50 w-80 bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
              <h3 className="font-semibold text-sm text-white">Notifications</h3>
              <button onClick={() => setOpen(false)}>
                <X size={14} className="text-gray-500" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-surface-border last:border-0 ${
                      !n.isRead ? "bg-brand-500/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="w-2 h-2 mt-1 rounded-full bg-brand-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-tight">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[10px] text-gray-600 mt-1">
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
