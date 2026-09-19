"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { role: "Owner (Super Admin)", email: "owner@leadyfy.com", desc: "Full unrestricted access" },
    { role: "Operations Admin", email: "admin@leadyfy.com", desc: "Operations, shoots, finances" },
    { role: "Sales Lead", email: "sales@leadyfy.com", desc: "Clients, leads, orders" },
    { role: "Scriptwriter", email: "writer@leadyfy.com", desc: "Assigned scripts & drafting" },
    { role: "Shoot Director", email: "shoot@leadyfy.com", desc: "Creators, shoot logistics" },
    { role: "Video Editor", email: "editor@leadyfy.com", desc: "Video queue & draft cuts" },
    { role: "Client Portal", email: "client@lumina.com", desc: "Isolated brand review hub" },
  ];

  const handleDemoSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user.role === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Auth Card */}
        <div className="lg:col-span-7 bg-[#111111] border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-charcoal shadow-md shadow-amber-500/20">
                L
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  LEADYFY <span className="text-amber-500 text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono">OS</span>
                </h1>
                <p className="text-xs text-zinc-400">Internal Agency Management & Operations</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">Sign in to your account</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your credentials or select a demo profile on the right to continue.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@leadyfy.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-charcoal font-semibold py-2.5 rounded-lg text-xs tracking-wide flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                {loading ? "Authenticating..." : "Sign In to Operating System"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> RBAC Enforced
            </span>
            <span>v1.0.0 Stable</span>
          </div>
        </div>

        {/* Right Side: Demo Accounts Selector */}
        <div className="lg:col-span-5 bg-[#111111]/70 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Demo Quick-Switch
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Password: Password123!
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              Click any role below to automatically fill credentials and test role-based access control and client isolation:
            </p>

            <div className="space-y-2">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleDemoSelect(demo.email)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between group ${
                    email === demo.email
                      ? "bg-amber-500/10 border-amber-500/40 text-zinc-100"
                      : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-zinc-200 group-hover:text-amber-400 transition">
                      {demo.role}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">{demo.email}</div>
                  </div>
                  <span className="text-[10px] text-zinc-500">{demo.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 text-center">
            Zero mock logic • Live SQLite / PostgreSQL Prisma backend
          </div>
        </div>
      </div>
    </div>
  );
}
