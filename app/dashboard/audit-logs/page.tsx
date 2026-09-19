"use client";

import React, { useState, useEffect } from "react";
import { FileSearch, ShieldCheck, Filter, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        entityType: entityFilter,
      });
      const res = await fetch(`/api/audit-logs?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-amber-400" /> Immutable Agency Audit Trail
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tamper-proof compliance log recording actor identity, state transitions, client revisions, and security events.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" /> Append-Only Guaranteed
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Entity Types</option>
            <option value="CLIENT">Client</option>
            <option value="ORDER">Order</option>
            <option value="SCRIPT">Script</option>
            <option value="SHOOT">Shoot</option>
            <option value="VIDEO">Video</option>
            <option value="PAYMENT">Payment</option>
            <option value="EXPENSE">Expense</option>
            <option value="CREATOR_PAYOUT">Creator Payout</option>
            <option value="TASK">Task</option>
            <option value="SUPPORT_TICKET">Support Ticket</option>
            <option value="USER">User / Security</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
            <tr>
              <th className="py-3.5 px-4">Actor</th>
              <th className="py-3.5 px-4">Action</th>
              <th className="py-3.5 px-4">Entity</th>
              <th className="py-3.5 px-4">Entity ID</th>
              <th className="py-3.5 px-4">Metadata Payload</th>
              <th className="py-3.5 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-zinc-500">Loading audit events...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-zinc-500">No logs found.</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">{l.actorName}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-amber-400 font-medium text-[11px]">{l.action}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="neutral">{l.entityType}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">{l.entityId}</td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-zinc-400 max-w-xs truncate">
                    {l.metadata || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[11px] text-zinc-500">
                    {formatDateTime(l.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
