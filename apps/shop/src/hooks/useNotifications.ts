import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications() as Notification[];
      setNotifications(data);
    } catch {
      // silently ignore on error
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await api.markNotificationsRead();
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Listen for new notifications via Supabase Realtime
    // The API broadcasts to the shop's channel when a new booking arrives
    const channel = supabase
      .channel("shop-notifications")
      .on("broadcast", { event: "NEW_NOTIFICATION" }, ({ payload }) => {
        const notif = payload as Notification;
        setNotifications((prev) => [notif, ...prev]);
        toast(notif.title, {
          icon: "🔔",
          duration: 4000,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications };
}
