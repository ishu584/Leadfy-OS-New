"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, FileText, Send, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Script for Drawer / Inspection
  const [selectedScript, setSelectedScript] = useState<any | null>(null);
  const [newComment, setNewComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // New Script Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    orderId: "",
    videoNumber: 1,
    language: "English",
    scriptText: "",
    referenceLinks: "",
    deadline: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchScripts();
    fetchOrdersAndClients();
  }, []);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scripts");
      if (res.ok) {
        const data = await res.json();
        setScripts(data.scripts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersAndClients = async () => {
    try {
      const [cRes, oRes] = await Promise.all([
        fetch("/api/clients?limit=100"),
        fetch("/api/orders"),
      ]);
      if (cRes.ok && oRes.ok) {
        const cData = await cRes.json();
        const oData = await oRes.json();
        setClients(cData.clients || []);
        setOrders(oData.orders || []);
        if (cData.clients?.length > 0 && !formData.clientId) {
          setFormData((prev) => ({
            ...prev,
            clientId: cData.clients[0].id,
            orderId: oData.orders?.[0]?.id || "",
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoNumber: Number(formData.videoNumber),
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          clientId: clients[0]?.id || "",
          orderId: orders[0]?.id || "",
          videoNumber: 1,
          language: "English",
          scriptText: "",
          referenceLinks: "",
          deadline: "",
        });
        fetchScripts();
      }
    } catch {
      // ignore
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusTransition = async (scriptId: string, nextStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedScript(json.script);
        fetchScripts();
      } else {
        const err = await res.json();
        alert(err.error || "Cannot transition script status");
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (scriptId: string) => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentText: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        // refresh selected script
        const refreshed = await fetch(`/api/scripts/${scriptId}`);
        if (refreshed.ok) {
          const json = await refreshed.json();
          setSelectedScript(json.script);
        }
      }
    } catch {
      // ignore
    }
  };

  const openInspection = async (script: any) => {
    try {
      const res = await fetch(`/api/scripts/${script.id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedScript(json.script);
      } else {
        setSelectedScript(script);
      }
    } catch {
      setSelectedScript(script);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Manual Scripting Desk</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Strict manual drafting, revisions counter, client approvals, and shoot-ready gating (Zero AI).
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Draft New Script
        </Button>
      </div>

      {/* Scripts List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table column */}
        <div className={selectedScript ? "lg:col-span-7" : "lg:col-span-12"}>
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Video #</th>
                  <th className="py-3 px-4">Client & Order</th>
                  <th className="py-3 px-4">Writer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Revisions</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-zinc-500">Loading scripts...</td></tr>
                ) : scripts.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-zinc-500">No scripts authored yet.</td></tr>
                ) : (
                  scripts.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => openInspection(s)}
                      className={`cursor-pointer transition ${
                        selectedScript?.id === s.id ? "bg-zinc-800/60" : "hover:bg-zinc-800/30"
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        #{s.videoNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-200">{s.client?.companyName}</div>
                        <div className="text-[11px] text-zinc-500">{s.order?.packageName}</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {s.writer?.name || "Unassigned"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            s.status === "APPROVED"
                              ? "success"
                              : s.status === "READY_FOR_SHOOT"
                              ? "amber"
                              : s.status === "REVISION_REQUIRED"
                              ? "danger"
                              : "neutral"
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        rev {s.revisionCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openInspection(s);
                          }}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-charcoal rounded text-[11px] font-medium transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Selected Script Detail Drawer */}
        {selectedScript && (
          <div className="lg:col-span-5">
            <Card className="border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" /> Script #{selectedScript.videoNumber}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {selectedScript.client?.companyName} • {selectedScript.language}
                  </p>
                </div>
                <Badge variant="amber">{selectedScript.status}</Badge>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1 pb-2 border-b border-zinc-800/80">
                {selectedScript.status === "DRAFT" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={actionLoading}
                    onClick={() => handleStatusTransition(selectedScript.id, "IN_REVIEW")}
                  >
                    Submit for Internal Review
                  </Button>
                )}
                {selectedScript.status === "IN_REVIEW" && (
                  <Button
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleStatusTransition(selectedScript.id, "SENT_TO_CLIENT")}
                    className="gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send to Client
                  </Button>
                )}
                {selectedScript.status === "APPROVED" && (
                  <Button
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleStatusTransition(selectedScript.id, "READY_FOR_SHOOT")}
                    className="gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-charcoal font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready for Shoot
                  </Button>
                )}
                {selectedScript.status === "REVISION_REQUIRED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={actionLoading}
                    onClick={() => handleStatusTransition(selectedScript.id, "IN_REVIEW")}
                  >
                    Resubmit Revised Script
                  </Button>
                )}
              </div>

              {/* Script Text Body */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Script Content:
                </label>
                <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto text-zinc-300">
                  {selectedScript.scriptText}
                </div>
              </div>

              {/* Comments / Revision Notes */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Comments & Feedback ({selectedScript.comments?.length || 0})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(!selectedScript.comments || selectedScript.comments.length === 0) ? (
                    <p className="text-[11px] text-zinc-500 py-1">No comments posted yet.</p>
                  ) : (
                    selectedScript.comments.map((c: any) => (
                      <div key={c.id} className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span className="font-semibold text-zinc-300">{c.author?.name} ({c.authorRole})</span>
                          <span>{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-zinc-300 text-[11px]">{c.commentText}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add a revision note or question..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                  <Button size="sm" variant="secondary" onClick={() => handleAddComment(selectedScript.id)}>
                    Post
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create Script Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft New Video Script (Manual)"
        description="Manual UGC script composition with hook, problem, solution, and CTA structure."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateScript} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Client *</label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Order Commitment *</label>
              <select
                required
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.packageName} (#{o.id.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Video Number in Order *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.videoNumber}
                onChange={(e) => setFormData({ ...formData, videoNumber: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Language</label>
              <input
                type="text"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="English"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Manual Script Text * (Hook, Body, CTA)</label>
            <textarea
              required
              rows={8}
              value={formData.scriptText}
              onChange={(e) => setFormData({ ...formData, scriptText: e.target.value })}
              placeholder="[HOOK - 0:00 to 0:03]:&#10;Stop scrolling if...&#10;&#10;[PROBLEM - 0:03 to 0:10]:&#10;I struggled with...&#10;&#10;[SOLUTION]:&#10;Until I found...&#10;&#10;[CTA]:&#10;Click below..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Save Script Draft
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
