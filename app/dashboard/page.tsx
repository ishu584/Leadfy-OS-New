"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Package,
  FileText,
  Calendar,
  Video,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/dashboard/metrics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const { metrics, pipelineCounts, financialKPIs, todayShoots, urgentTasks, pendingClientVideoApprovals, recentActivity } =
    data || {};

  return (
    <div className="space-y-8 select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Executive Operations Console</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time overview of active agency operations, shoots, video pipelines, and financial performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            Manage Orders
          </Link>
          <Link
            href="/dashboard/clients"
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-charcoal shadow-sm shadow-amber-500/20 transition"
          >
            + Add Client
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Clients */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Clients</p>
            <h4 className="text-2xl font-bold text-zinc-100 mt-1">{metrics?.activeClientsCount ?? 0}</h4>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              +{metrics?.newClientsCount ?? 0} new onboarding
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        {/* Active Orders */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Orders</p>
            <h4 className="text-2xl font-bold text-zinc-100 mt-1">{metrics?.activeOrdersCount ?? 0}</h4>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1 font-mono">
              In production queue
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Package className="w-5 h-5" />
          </div>
        </Card>

        {/* Pending Scripts */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pending Scripts</p>
            <h4 className="text-2xl font-bold text-zinc-100 mt-1">{metrics?.pendingScriptsCount ?? 0}</h4>
            <span className="text-[11px] text-yellow-400 flex items-center gap-1 mt-1 font-mono">
              Writing & drafting
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            <FileText className="w-5 h-5" />
          </div>
        </Card>

        {/* Upcoming Shoots */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Upcoming Shoots</p>
            <h4 className="text-2xl font-bold text-zinc-100 mt-1">{metrics?.upcomingShootsCount ?? 0}</h4>
            <span className="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-mono">
              Creators booked
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Financial Executive Strip (Owner & Admin Only) */}
      {financialKPIs && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-900/90">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-sm">Financial Health & Net Profit (Restricted to Owner/Admin)</CardTitle>
            </div>
            <Link
              href="/dashboard/reports"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              Detailed Breakdown <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Total Revenue</p>
              <p className="text-lg font-bold text-zinc-100 mt-0.5">{formatCurrency(financialKPIs.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Pending Receivables</p>
              <p className="text-lg font-bold text-yellow-400 mt-0.5">{formatCurrency(financialKPIs.totalReceivables)}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Agency Expenses</p>
              <p className="text-lg font-bold text-rose-400 mt-0.5">{formatCurrency(financialKPIs.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Creator Payouts</p>
              <p className="text-lg font-bold text-sky-400 mt-0.5">{formatCurrency(financialKPIs.totalPayouts)}</p>
            </div>
            <div className="lg:col-span-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Net Profit
              </p>
              <p className="text-xl font-extrabold text-emerald-300 mt-0.5">
                {formatCurrency(financialKPIs.netProfit)}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Revenue - Expenses - Payouts</p>
            </div>
          </div>
        </Card>
      )}

      {/* Video Production Pipeline Status Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-400" /> Video Pipeline Distribution (9 Stages)
          </CardTitle>
          <Link href="/dashboard/videos" className="text-xs text-amber-400 hover:underline">
            View Board
          </Link>
        </CardHeader>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center">
          {[
            { key: "SCRIPT_APPROVED", label: "1. Script Appr" },
            { key: "SHOOT_PENDING", label: "2. Shoot Pend" },
            { key: "RAW_FOOTAGE_RECEIVED", label: "3. Raw Recv" },
            { key: "VIDEO_EDITING", label: "4. Editing" },
            { key: "INTERNAL_QA", label: "5. QA" },
            { key: "CLIENT_REVIEW", label: "6. Client Rev" },
            { key: "REVISION", label: "7. Revision" },
            { key: "FINAL_APPROVED", label: "8. Approved" },
            { key: "DELIVERED", label: "9. Delivered" },
          ].map((stage) => {
            const count = pipelineCounts?.[stage.key] || 0;
            return (
              <div
                key={stage.key}
                className={`p-2.5 rounded-lg border transition ${
                  count > 0 ? "bg-zinc-800/80 border-amber-500/30 text-amber-400" : "bg-zinc-900/40 border-zinc-800/60 text-zinc-500"
                }`}
              >
                <div className="text-xs font-mono font-bold">{count}</div>
                <div className="text-[10px] truncate mt-1 text-zinc-300">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Operational Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Shoots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Today's Shoots
            </CardTitle>
            <Badge variant="neutral">{todayShoots?.length || 0}</Badge>
          </CardHeader>
          <div className="space-y-3">
            {(!todayShoots || todayShoots.length === 0) ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No shoots scheduled for today.</p>
            ) : (
              todayShoots.map((shoot: any) => (
                <div key={shoot.id} className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{shoot.creator?.name}</span>
                    <Badge variant="amber">{shoot.shootTime}</Badge>
                  </div>
                  <p className="text-zinc-400 text-[11px] truncate">{shoot.location}</p>
                  <p className="text-zinc-500 text-[10px]">{shoot.client?.companyName}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Urgent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Urgent Action Items
            </CardTitle>
            <Badge variant="danger">{urgentTasks?.length || 0}</Badge>
          </CardHeader>
          <div className="space-y-3">
            {(!urgentTasks || urgentTasks.length === 0) ? (
              <p className="text-xs text-zinc-500 py-4 text-center">All urgent tasks completed!</p>
            ) : (
              urgentTasks.map((t: any) => (
                <div key={t.id} className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-200 truncate">{t.title}</span>
                    <Badge variant="danger">URGENT</Badge>
                  </div>
                  <p className="text-zinc-400 text-[11px] line-clamp-1">{t.description || "No description"}</p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>Assignee: {t.assignee?.name || "Unassigned"}</span>
                    <span>{formatDateTime(t.deadline)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Client Video Review Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Pending Client Video Approvals
            </CardTitle>
            <Badge variant="warning">{pendingClientVideoApprovals?.length || 0}</Badge>
          </CardHeader>
          <div className="space-y-3">
            {(!pendingClientVideoApprovals || pendingClientVideoApprovals.length === 0) ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No videos awaiting client review.</p>
            ) : (
              pendingClientVideoApprovals.map((v: any) => (
                <div key={v.id} className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{v.client?.companyName}</span>
                    <Badge variant="warning">Awaiting Review</Badge>
                  </div>
                  <p className="text-zinc-400 text-[11px]">Editor: {v.assignedEditor?.name || "Unassigned"}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-500">Revisions: {v.revisionCount}</span>
                    <Link href={`/dashboard/videos`} className="text-[11px] text-amber-400 hover:underline">
                      Inspect Cut →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Live System Activity Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recent Activity & Audit Events
          </CardTitle>
          <Link href="/dashboard/audit-logs" className="text-xs text-zinc-400 hover:text-zinc-200">
            View All Logs →
          </Link>
        </CardHeader>
        <div className="divide-y divide-zinc-800/60">
          {(!recentActivity || recentActivity.length === 0) ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No activity recorded yet.</p>
          ) : (
            recentActivity.map((log: any) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-medium text-zinc-200">{log.actorName}</span>
                  <span className="text-zinc-400 font-mono text-[11px]">{log.action}</span>
                  <span className="text-zinc-500 text-[11px]">({log.entityType})</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">{formatDateTime(log.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
