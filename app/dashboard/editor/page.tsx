"use client";

import React, { useState, useEffect } from "react";
import { Scissors, Clock, AlertTriangle, CheckCircle2, Play, ExternalLink, Send } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function EditorDashboardPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active cut submission modal
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [editDraftUrl, setEditDraftUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchEditorQueue();
  }, []);

  const fetchEditorQueue = async () => {
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

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Group work: Overdue, Due Today, Due Tomorrow, Completed
  const overdue: any[] = [];
  const dueToday: any[] = [];
  const dueTomorrow: any[] = [];
  const completed: any[] = [];

  for (const v of videos) {
    if (["FINAL_APPROVED", "DELIVERED"].includes(v.status)) {
      completed.push(v);
      continue;
    }
    if (!v.deadline) {
      dueToday.push(v);
      continue;
    }
    const d = new Date(v.deadline);
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (dateOnly < today) {
      overdue.push(v);
    } else if (dateOnly.getTime() === today.getTime()) {
      dueToday.push(v);
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      dueTomorrow.push(v);
    } else {
      dueTomorrow.push(v);
    }
  }

  const handleSubmitCut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVideo) return;
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/videos/${activeVideo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editDraftUrl,
          status: "INTERNAL_QA",
        }),
      });
      if (res.ok) {
        setActiveVideo(null);
        fetchEditorQueue();
      }
    } catch {
      // ignore
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderQueueSection = (title: string, list: any[], badgeVariant: any, icon: any) => {
    const Icon = icon;
    return (
      <Card className="space-y-4">
        <CardHeader className="pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </div>
          <Badge variant={badgeVariant}>{list.length}</Badge>
        </CardHeader>
        <div className="space-y-3">
          {list.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 text-center">No tasks in this queue.</p>
          ) : (
            list.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs space-y-2 hover:border-zinc-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">{v.client?.companyName}</span>
                  <Badge variant={v.status === "REVISION" ? "danger" : "amber"}>{v.status}</Badge>
                </div>

                <p className="text-zinc-400 text-[11px] line-clamp-1">{v.order?.packageName}</p>

                {v.revisionCount > 0 && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Revision #{v.revisionCount} Notes:
                    </span>
                    <p className="line-clamp-2">{v.feedbacks?.[0]?.feedbackText || "Check feedback history."}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-mono">Due: {formatDate(v.deadline)}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveVideo(v);
                      setEditDraftUrl(v.editDraftUrl || "");
                    }}
                    className="gap-1 text-[11px] py-1"
                  >
                    <Scissors className="w-3 h-3" /> Submit Cut
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Scissors className="w-5 h-5 text-amber-400" /> Lead Video Editor Console
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Assigned cutting queues grouped by deadlines, revision responses, and QA submissions.
          </p>
        </div>
      </div>

      {/* 4 Grouped Queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {renderQueueSection("Overdue Tasks", overdue, "danger", AlertTriangle)}
        {renderQueueSection("Due Today", dueToday, "warning", Clock)}
        {renderQueueSection("Due Tomorrow & Later", dueTomorrow, "neutral", Clock)}
        {renderQueueSection("Completed Masters", completed, "success", CheckCircle2)}
      </div>

      {/* Submit Cut Modal */}
      {activeVideo && (
        <Modal
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
          title={`Submit Video Edit Cut — ${activeVideo.client?.companyName}`}
          maxWidth="md"
        >
          <form onSubmit={handleSubmitCut} className="space-y-4 text-xs">
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1">
              <span className="text-zinc-400 font-mono text-[10px]">VID-{activeVideo.id.slice(-6)}</span>
              <p className="font-semibold text-zinc-200">{activeVideo.order?.packageName}</p>
              {activeVideo.rawFootageUrl && (
                <a
                  href={activeVideo.rawFootageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[11px] pt-1"
                >
                  <ExternalLink className="w-3 h-3" /> Open Raw Footage Drive
                </a>
              )}
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">New Draft Video Render / Drive Link *</label>
              <input
                type="text"
                required
                value={editDraftUrl}
                onChange={(e) => setEditDraftUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button variant="secondary" type="button" onClick={() => setActiveVideo(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitLoading} className="gap-1.5">
                <Send className="w-3.5 h-3.5" /> Submit to Internal QA
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
