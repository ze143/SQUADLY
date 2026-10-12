import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const list = data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("useNotifications:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!profile?.id) return;

    // اسم فريد لكل instance
    const channelName = `notifications-${profile.id}-${Math.random().toString(36).substring(7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === payload.new.id)) return prev;
            return [payload.new, ...prev].slice(0, 50);
          });
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    if (error) throw error;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const removeNotification = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) throw error;
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      if (removed && !removed.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  const clearAll = async () => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", profile.id);
    if (error) throw error;
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
}
