"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, CheckCheck } from "lucide-react";
import { SessionUser } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";

interface TopbarProps {
  user: SessionUser;
}

export const Topbar: React.FC<TopbarProps> = ({ user }) => {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Derive human-readable breadcrumb title
  const segments = pathname.split("/").filter(Boolean);
  const currentTitle =
    segments.length > 1
      ? segments[segments.length - 1].replace(/-/g, " ").toUpperCase()
      : "DASHBOARD";

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <header className="h-16 bg-[#111111]/80 backdrop-blur-md border-b border-zinc-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400 font-mono">LEADYFY OS</span>
        <span className="text-zinc-500">/</span>
        <h1 className="text-sm font-semibold tracking-wide text-zinc-100">{currentTitle}</h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Quick search... (Press / to focus)"
            className="pl-8 pr-4 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 w-64 transition"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/80 relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-200">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-400 rounded font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition ${
                        !n.isRead ? "bg-amber-500/5" : "hover:bg-zinc-800/30"
                      }`}
                    >
                      <p className="font-medium text-zinc-200">{n.title}</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-1">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-semibold text-xs">
            {user.name.charAt(0)}
          </div>
          <span className="text-xs font-medium text-zinc-200 hidden sm:inline">{user.name}</span>
        </div>
      </div>
    </header>
  );
};
