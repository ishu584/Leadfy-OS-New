"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  FileText,
  Video,
  CreditCard,
  LifeBuoy,
  Play,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  ExternalLink,
  Plus,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function ClientPortalPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "scripts" | "videos" | "invoices" | "tickets">("videos");
  const [orders, setOrders] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Video Review & Feedback Modal
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [timestampCode, setTimestampCode] = useState("00:15");
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Script Review Modal
  const [selectedScript, setSelectedScript] = useState<any | null>(null);
  const [scriptActionLoading, setScriptActionLoading] = useState(false);

  // New Support Ticket Modal
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const [oRes, sRes, vRes, pRes, tRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/scripts"),
        fetch("/api/videos"),
        fetch("/api/payments"),
        fetch("/api/tickets"),
      ]);

      if (oRes.ok) setOrders((await oRes.json()).orders || []);
      if (sRes.ok) setScripts((await sRes.json()).scripts || []);
      if (vRes.ok) setVideos((await vRes.json()).videos || []);
      if (pRes.ok) setPayments((await pRes.json()).payments || []);
      if (tRes.ok) setTickets((await tRes.json()).tickets || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleApproveScript = async (scriptId: string) => {
    setScriptActionLoading(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (res.ok) {
        setSelectedScript(null);
        fetchPortalData();
      }
    } catch {
      // ignore
    } finally {
      setScriptActionLoading(false);
    }
  };

  const handleRequestScriptRevision = async (scriptId: string) => {
    setScriptActionLoading(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVISION_REQUIRED" }),
      });
      if (res.ok) {
        setSelectedScript(null);
        fetchPortalData();
      }
    } catch {
      // ignore
    } finally {
      setScriptActionLoading(false);
    }
  };

  const handleApproveVideo = async (videoId: string) => {
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setSelectedVideo(null);
        fetchPortalData();
      }
    } catch {
      // ignore
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmitVideoFeedback = async (e: React.FormEvent, action: "REVISION_REQUESTED" | "COMMENT_ONLY") => {
    e.preventDefault();
    if (!selectedVideo || !feedbackText.trim()) return;
    setSubmittingFeedback(true);

    try {
      const res = await fetch(`/api/videos/${selectedVideo.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestampCode,
          feedbackText,
          action,
        }),
      });
      if (res.ok) {
        setSelectedVideo(null);
        setFeedbackText("");
        fetchPortalData();
      }
    } catch {
      // ignore
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage,
          priority: "MEDIUM",
        }),
      });
      if (res.ok) {
        setIsTicketOpen(false);
        setTicketSubject("");
        setTicketMessage("");
        fetchPortalData();
      }
    } catch {
      // ignore
    } finally {
      setTicketLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Portal Hero Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-[#18181b] border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block mb-1">
            Client Brand Portal
          </span>
          <h2 className="text-2xl font-bold text-zinc-100">Production Review & Delivery Hub</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review script drafts, approve video cuts with timestamped feedback, and download final masters.
          </p>
        </div>
        <Button onClick={() => setIsTicketOpen(true)} variant="outline" size="sm" className="gap-2 shrink-0">
          <LifeBuoy className="w-3.5 h-3.5 text-amber-400" /> Open Support Ticket
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-3 text-xs overflow-x-auto">
        {[
          { key: "videos", label: `Video Reviews (${videos.length})`, icon: Video },
          { key: "scripts", label: `Scripts Review (${scripts.length})`, icon: FileText },
          { key: "orders", label: `Active Packages (${orders.length})`, icon: Package },
          { key: "invoices", label: `Invoices & Billing (${payments.length})`, icon: CreditCard },
          { key: "tickets", label: `Support Tickets (${tickets.length})`, icon: LifeBuoy },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition shrink-0 ${
                isActive
                  ? "border-amber-500 text-amber-400 bg-amber-500/5 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Video Review Tab */}
      {activeTab === "videos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.length === 0 ? (
            <p className="col-span-3 text-center py-12 text-zinc-500 text-xs">No video cuts currently in production.</p>
          ) : (
            videos.map((v) => (
              <Card key={v.id} className="space-y-3.5 hover:border-amber-500/40 transition">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-zinc-400 font-semibold">VID-{v.id.slice(-6)}</span>
                  <Badge variant={v.status === "DELIVERED" ? "success" : v.status === "FINAL_APPROVED" ? "amber" : "neutral"}>
                    {v.status}
                  </Badge>
                </div>

                {/* Video Preview Box */}
                <div className="relative aspect-video rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden group">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-zinc-700 font-mono text-xs">Preview Draft Cut</div>
                  )}
                  {v.editDraftUrl && (
                    <a
                      href={v.editDraftUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-500 text-charcoal flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </a>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-zinc-200">
                    {v.script?.scriptText ? v.script.scriptText.slice(0, 60) + "..." : v.order?.packageName}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Revisions: {v.revisionCount}</span>
                    <span>Deadline: {formatDate(v.deadline)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  {v.finalDeliveryUrl ? (
                    <a
                      href={v.finalDeliveryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-charcoal font-bold rounded-lg text-xs text-center flex items-center justify-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Download Final Master
                    </a>
                  ) : ["CLIENT_REVIEW", "INTERNAL_QA", "REVISION"].includes(v.status) ? (
                    <Button size="sm" className="w-full gap-1.5" onClick={() => setSelectedVideo(v)}>
                      <MessageSquare className="w-3.5 h-3.5" /> Review & Submit Feedback
                    </Button>
                  ) : (
                    <span className="text-[11px] text-zinc-500 italic py-1">In post-production</span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Script Review Tab */}
      {activeTab === "scripts" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Video #</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4">Script Excerpt</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {scripts.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-500">No scripts ready for review.</td></tr>
              ) : (
                scripts.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-amber-400 font-mono">#{s.videoNumber}</td>
                    <td className="py-3.5 px-4 text-zinc-300">{s.language}</td>
                    <td className="py-3.5 px-4 text-zinc-400 max-w-md truncate font-mono text-[11px]">
                      {s.scriptText}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={s.status === "APPROVED" ? "success" : "amber"}>{s.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedScript(s)}>
                        Inspect & Approve
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {orders.map((o) => (
            <Card key={o.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-zinc-100">{o.packageName}</h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">Order #{o.id.slice(-6)}</p>
                </div>
                <Badge variant="amber">{o.status}</Badge>
              </div>

              {/* Counter details */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Total Contracted Videos:</span>
                  <span className="font-bold text-zinc-200">{o.contractedVideoCount}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Completed & Delivered:</span>
                  <span className="font-bold text-emerald-400">{o.productionCounters?.completedVideos ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Remaining Quota:</span>
                  <span className="font-bold text-amber-400">{o.productionCounters?.remainingQuota ?? 0}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <span>Timeline: {formatDate(o.startDate)} – {formatDate(o.dueDate)}</span>
                <span className="font-bold text-zinc-200 font-mono">{formatCurrency(o.totalAmount)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice Amount</th>
                <th className="py-3 px-4">Paid Amount</th>
                <th className="py-3 px-4">Outstanding Balance</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {payments.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500">No invoices recorded.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-200">{formatCurrency(p.invoiceAmount)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{formatCurrency(p.amountReceived)}</td>
                    <td className="py-3 px-4 font-mono text-yellow-400">{formatCurrency(p.pendingBalance)}</td>
                    <td className="py-3 px-4 text-zinc-400">{p.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4"><Badge variant={p.status === "PAID" ? "success" : "warning"}>{p.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-zinc-800/60">
            {tickets.length === 0 ? (
              <p className="py-8 text-center text-zinc-500 text-xs">No active support tickets.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-zinc-100">{t.subject}</h4>
                    <Badge variant={t.status === "RESOLVED" ? "success" : "amber"}>{t.status}</Badge>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{t.message}</p>
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between pt-1">
                    <span>Filed on {formatDateTime(t.createdAt)}</span>
                    <span>{t.responses?.length || 0} response(s)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Video Review Modal with Timestamped Feedback & Approval */}
      {selectedVideo && (
        <Modal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          title={`Review Video Cut — VID-${selectedVideo.id.slice(-6)}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {selectedVideo.editDraftUrl ? (
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
                <iframe
                  src={selectedVideo.editDraftUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 bg-zinc-950 rounded-lg">Draft render link pending</div>
            )}

            {/* Final Approval Strip */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-400 text-xs">Satisfied with this cut?</p>
                <p className="text-[11px] text-zinc-400">
                  Approving triggers final delivery processing and generates your high-res master download link.
                </p>
              </div>
              <Button
                size="sm"
                loading={submittingFeedback}
                onClick={() => handleApproveVideo(selectedVideo.id)}
                className="bg-emerald-500 hover:bg-emerald-400 text-charcoal font-bold shrink-0 gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Final Approve
              </Button>
            </div>

            {/* Request Revision with Timestamp */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h4 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Need changes? Request Revision:
              </h4>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Timestamp</label>
                  <input
                    type="text"
                    value={timestampCode}
                    onChange={(e) => setTimestampCode(e.target.value)}
                    placeholder="00:15"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] text-zinc-400 mb-1">Feedback / Change Request *</label>
                  <input
                    type="text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="e.g. Trim the intro pause, swap audio track, or adjust color grading..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  loading={submittingFeedback}
                  onClick={(e) => handleSubmitVideoFeedback(e, "COMMENT_ONLY")}
                >
                  Post Comment Only
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={submittingFeedback}
                  onClick={(e) => handleSubmitVideoFeedback(e, "REVISION_REQUESTED")}
                  className="gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Request Revision & Return to Editor
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Script Inspection Modal */}
      {selectedScript && (
        <Modal
          isOpen={!!selectedScript}
          onClose={() => setSelectedScript(null)}
          title={`Review Script #${selectedScript.videoNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto text-zinc-200">
              {selectedScript.scriptText}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <Button
                variant="danger"
                size="sm"
                loading={scriptActionLoading}
                onClick={() => handleRequestScriptRevision(selectedScript.id)}
              >
                Request Script Revision
              </Button>
              <Button
                size="sm"
                loading={scriptActionLoading}
                onClick={() => handleApproveScript(selectedScript.id)}
                className="bg-emerald-500 hover:bg-emerald-400 text-charcoal font-bold gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Script for Shoot
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Support Ticket Modal */}
      <Modal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        title="Open Agency Support Ticket"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="e.g. Request extra aspect ratio cuts or billing query"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">Message *</label>
            <textarea
              required
              rows={4}
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Describe your request..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsTicketOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={ticketLoading}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
