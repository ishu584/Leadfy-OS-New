"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { SessionUser } from "@/lib/rbac";

const Sidebar = dynamic(() => import("./sidebar").then((m) => m.Sidebar), {
  ssr: false,
});

const Topbar = dynamic(() => import("./topbar").then((m) => m.Topbar), {
  ssr: false,
});

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!isLoginPage);

  // Automatic recovery from any transient deployment/cache ChunkLoadError
  useEffect(() => {
    const handleChunkError = (e: ErrorEvent) => {
      if (/Loading chunk .* failed/i.test(e.message) || e.message?.includes("ChunkLoadError")) {
        const key = "leadyfy_chunk_reload";
        const last = sessionStorage.getItem(key);
        if (!last || Date.now() - parseInt(last, 10) > 8000) {
          sessionStorage.setItem(key, Date.now().toString());
          window.location.reload();
        }
      }
    };
    window.addEventListener("error", handleChunkError);
    return () => window.removeEventListener("error", handleChunkError);
  }, []);

  useEffect(() => {
    // Skip shell check on login page
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.user) {
          router.push("/login");
          return;
        }

        // Strict Client Isolation: If client navigates to internal dashboard, redirect to /portal
        if (data.user.role === "CLIENT" && pathname && !pathname.startsWith("/portal")) {
          router.push("/portal");
          return;
        }

        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [pathname, router, isLoginPage]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-charcoal animate-pulse">
            L
          </div>
          <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Loading LEADYFY OS...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Dedicated Client Portal Layout
  if (user.role === "CLIENT") {
    return (
      <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 flex flex-col">
        <header className="h-16 bg-[#111111] border-b border-zinc-800 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-charcoal shadow-sm shadow-amber-500/20">
              L
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                LEADYFY OS <span className="text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">Client Portal</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-300 font-medium">{user.name}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition"
            >
              Sign Out
            </button>
          </div>
        </header>
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    );
  }

  // Internal Agency App Shell
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 flex">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
