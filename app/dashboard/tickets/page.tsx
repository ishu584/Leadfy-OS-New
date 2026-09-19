"use client";

import React, { useState, useEffect } from "react";
import { LifeBuoy, MessageSquare, Send, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default function InternalTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("IN_PROGRESS");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyMessage,
          status: replyStatus,
        }),
      });
      if (res.ok) {
        setReplyMessage("");
        const refreshed = await fetch(`/api/tickets/${selectedTicket.id}`);
        if (refreshed.ok) {
          const json = await refreshed.json();
          setSelectedTicket(json.ticket);
        }
        fetchTickets();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100">Client Support Tickets Desk</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Respond to client inquiries, resolve requests, and manage issue threads.
        </p>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket List */}
        <div className={selectedTicket ? "lg:col-span-5" : "lg:col-span-12"}>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-zinc-800/60">
              {loading ? (
                <p className="py-8 text-center text-zinc-500 text-xs">Loading tickets...</p>
              ) : tickets.length === 0 ? (
                <p className="py-8 text-center text-zinc-500 text-xs">No support tickets currently open.</p>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 cursor-pointer text-xs space-y-1.5 transition ${
                      selectedTicket?.id === t.id ? "bg-zinc-800/60" : "hover:bg-zinc-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">{t.client?.companyName}</span>
                      <Badge variant={t.status === "RESOLVED" ? "success" : t.status === "IN_PROGRESS" ? "amber" : "neutral"}>
                        {t.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-zinc-300">{t.subject}</p>
                    <p className="text-zinc-500 text-[11px] line-clamp-1">{t.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                      <span>Responses: {t.responses?.length || 0}</span>
                      <span>{formatDateTime(t.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Selected Ticket Thread */}
        {selectedTicket && (
          <div className="lg:col-span-7">
            <Card className="border-amber-500/30 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">{selectedTicket.subject}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Filed by <strong className="text-zinc-200">{selectedTicket.client?.companyName}</strong> on {formatDateTime(selectedTicket.createdAt)}
                  </p>
                </div>
                <Badge variant="amber">{selectedTicket.status}</Badge>
              </div>

              {/* Initial Client Message */}
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-1">
                <span className="font-mono text-[10px] text-zinc-500 uppercase block">Client Request:</span>
                <p className="text-zinc-200 leading-relaxed">{selectedTicket.message}</p>
              </div>

              {/* Responses Thread */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Thread Conversation ({selectedTicket.responses?.length || 0})
                </h4>

                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {(!selectedTicket.responses || selectedTicket.responses.length === 0) ? (
                    <p className="text-zinc-500 text-xs italic py-2">No internal responses yet.</p>
                  ) : (
                    selectedTicket.responses.map((r: any) => (
                      <div key={r.id} className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span className="font-bold text-amber-400">{r.authorName} ({r.authorRole})</span>
                          <span>{formatDateTime(r.createdAt)}</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px]">{r.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-zinc-800 space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Reply to Client *</label>
                  <textarea
                    rows={3}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type official agency response..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[11px]">Update Status:</span>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolve Ticket</option>
                      <option value="OPEN">Keep Open</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" loading={submitting} className="gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Dispatch Reply
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
