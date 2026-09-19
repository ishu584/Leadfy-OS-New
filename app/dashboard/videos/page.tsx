"use client";

import React, { useState, useEffect } from "react";
import { Plus, Video, Play, ExternalLink, MessageSquare, AlertTriangle, CheckCircle2, Scissors } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function VideosPipelinePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Video Drawer / Modal
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [editDraftUrl, setEditDraftUrl] = useState("");
  const [finalDeliveryUrl, setFinalDeliveryUrl] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Create Video Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    orderId: "",
  });

  useEffect(() => {
    fetchVideos();
    loadRelations();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/videos");
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadRelations = async () => {
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
        if (cData.clients?.length > 0 && oData.orders?.length > 0) {
          setFormData({
            clientId: cData.clients[0].id,
            orderId: oData.orders[0].id,
          });
        }
      }
    } catch {
      // ignore
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "SCRIPT_APPROVED",
        }),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        fetchVideos();
      }
    } catch {
      // ignore
    }
  };

  const handleTransition = async (videoId: string, nextStatus: string) => {
    setActionLoading(true);
    try {
      const payload: any = { status: nextStatus };
      if (editDraftUrl) payload.editDraftUrl = editDraftUrl;
      if (finalDeliveryUrl) payload.finalDeliveryUrl = finalDeliveryUrl;

      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Cannot transition state");
      } else {
        setSelectedVideo(json.video);
        fetchVideos();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const STAGES = [
    { key: "SCRIPT_APPROVED", label: "Script Approved" },
    { key: "SHOOT_PENDING", label: "Shoot Pending" },
    { key: "RAW_FOOTAGE_RECEIVED", label: "Raw Footage Recv" },
    { key: "VIDEO_EDITING", label: "Video Editing" },
    { key: "INTERNAL_QA", label: "Internal QA" },
    { key: "CLIENT_REVIEW", label: "Client Review" },
    { key: "REVISION", label: "Revision Queue" },
    { key: "FINAL_APPROVED", label: "Final Approved" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">9-Stage Video Production Pipeline</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Strict linear state machine enforcing manual script approval → shoot → editing → QA → client review → final delivery.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Initialize Video Slot
        </Button>
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {STAGES.map((stage) => {
          const stageVideos = videos.filter((v) => v.status === stage.key);
          return (
            <div key={stage.key} className="w-72 shrink-0 space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-200">{stage.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-amber-400 font-bold">
                  {stageVideos.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[500px] p-2 rounded-xl bg-zinc-950/50 border border-zinc-900">
                {stageVideos.length === 0 ? (
                  <div className="py-12 text-center text-zinc-600 text-[11px]">Empty stage</div>
                ) : (
                  stageVideos.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVideo(v);
                        setEditDraftUrl(v.editDraftUrl || "");
                        setFinalDeliveryUrl(v.finalDeliveryUrl || "");
                      }}
                      className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-zinc-400 text-[10px]">VID-{v.id.slice(-6)}</span>
                        {v.revisionCount > 0 && (
                          <Badge variant="warning">Rev {v.revisionCount}</Badge>
                        )}
                      </div>

                      <h4 className="font-semibold text-zinc-200 line-clamp-1">{v.client?.companyName}</h4>
                      <p className="text-[11px] text-zinc-400">{v.order?.packageName}</p>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>Editor: {v.assignedEditor?.name?.split(" ")[0] || "None"}</span>
                        <span>{formatDate(v.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Video Inspection Modal */}
      {selectedVideo && (
        <Modal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          title={`Video VID-${selectedVideo.id.slice(-6)} Details`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h4 className="font-bold text-sm text-zinc-100">{selectedVideo.client?.companyName}</h4>
                <p className="text-[11px] text-zinc-400">{selectedVideo.order?.packageName}</p>
              </div>
              <Badge variant="amber">{selectedVideo.status}</Badge>
            </div>

            {/* State Transition Actions */}
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2">
              <label className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] block">
                Workflow Transition Actions:
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedVideo.status === "SCRIPT_APPROVED" && (
                  <Button size="sm" onClick={() => handleTransition(selectedVideo.id, "SHOOT_PENDING")}>
                    Move to Shoot Pending
                  </Button>
                )}
                {selectedVideo.status === "SHOOT_PENDING" && (
                  <Button size="sm" onClick={() => handleTransition(selectedVideo.id, "RAW_FOOTAGE_RECEIVED")}>
                    Mark Raw Footage Received
                  </Button>
                )}
                {selectedVideo.status === "RAW_FOOTAGE_RECEIVED" && (
                  <Button size="sm" onClick={() => handleTransition(selectedVideo.id, "VIDEO_EDITING")}>
                    Assign to Video Editing
                  </Button>
                )}
                {selectedVideo.status === "VIDEO_EDITING" && (
                  <Button size="sm" onClick={() => handleTransition(selectedVideo.id, "INTERNAL_QA")}>
                    Submit Cut to Internal QA
                  </Button>
                )}
                {selectedVideo.status === "INTERNAL_QA" && (
                  <Button size="sm" onClick={() => handleTransition(selectedVideo.id, "CLIENT_REVIEW")}>
                    Send to Client for Review
                  </Button>
                )}
                {selectedVideo.status === "REVISION" && (
                  <Button size="sm" onClick={() => handleTransition(selectedVideo.id, "VIDEO_EDITING")}>
                    Return to Video Editing
                  </Button>
                )}
                {selectedVideo.status === "FINAL_APPROVED" && (
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-400 text-charcoal font-bold"
                    onClick={() => handleTransition(selectedVideo.id, "DELIVERED")}
                  >
                    Mark as Final Delivered
                  </Button>
                )}
              </div>
            </div>

            {/* Links and URLs */}
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Draft Edit Video / Render URL</label>
                <input
                  type="text"
                  value={editDraftUrl}
                  onChange={(e) => setEditDraftUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Final Delivery Master Link</label>
                <input
                  type="text"
                  value={finalDeliveryUrl}
                  onChange={(e) => setFinalDeliveryUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Feedback History */}
            {selectedVideo.feedbacks?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] block">
                  Client Revision & Timestamp Feedback History:
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedVideo.feedbacks.map((f: any) => (
                    <div key={f.id} className="p-2.5 bg-zinc-950 rounded border border-zinc-800 text-[11px] space-y-1">
                      <div className="flex justify-between font-mono text-zinc-500 text-[10px]">
                        <span className="text-amber-400 font-bold">⏱ {f.timestampCode}</span>
                        <span>{formatDate(f.createdAt)}</span>
                      </div>
                      <p className="text-zinc-300">{f.feedbackText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button size="sm" variant="secondary" onClick={() => setSelectedVideo(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Initialize Video Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Initialize Video Production Slot"
        maxWidth="md"
      >
        <form onSubmit={handleCreateVideo} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Client Account *</label>
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

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Video Slot</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
