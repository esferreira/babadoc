"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { getUnreadNotificationsCount, getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load unread count on mount and interval
  useEffect(() => {
    async function fetchCount() {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function toggleDropdown() {
    if (!isOpen) {
      setIsLoading(true);
      const data = await getNotifications();
      setNotifications(data);
      setIsLoading(false);
    }
    setIsOpen(!isOpen);
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    });
  }

  function handleNotificationClick(notif: any) {
    if (!notif.read) {
      startTransition(async () => {
        await markAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  }

  const ICON_MAP: Record<string, string> = {
    NEW_FACET: "✏️",
    NEW_COMMENT: "💬",
    REVIEW_REQUIRED: "⏳",
    ARTIFACT_UPDATED: "📦",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-10 h-10 rounded-full transition-colors relative hover:bg-black/10 dark:hover:bg-white/10"
        style={{ color: "var(--text-muted)" }}
        title="Notificações"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
            style={{ background: "var(--danger)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 animate-fade-in border flex flex-col"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-muted)", maxHeight: "400px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-muted)" }}>
            <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="text-xs hover:underline"
                style={{ color: "var(--accent-text)" }}
              >
                Ler todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>Carregando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                <span className="text-3xl opacity-50">📭</span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Nenhuma notificação por enquanto.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className="w-full text-left px-4 py-3 border-b hover:bg-white/5 transition-colors flex items-start gap-3"
                    style={{
                      borderColor: "var(--border-muted)",
                      background: n.read ? "transparent" : "var(--accent-subtle)",
                    }}
                  >
                    <div className="mt-0.5 text-lg">{ICON_MAP[n.type] ?? "🔔"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {n.title}
                      </div>
                      {n.message && (
                        <div className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                          {n.message}
                        </div>
                      )}
                      <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                        {new Date(n.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
