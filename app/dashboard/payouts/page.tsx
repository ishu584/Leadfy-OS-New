"use client";

import React, { useState, useEffect } from "react";
import { Plus, DollarSign, CheckCircle2, AlertTriangle, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CreatorPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Payout Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    creatorId: "",
    orderId: "",
    videoId: "",
    videoCount: 1,
    contractedRate: 250,
    paymentDate: new Date().toISOString().slice(0, 10),
    transactionRef: "",
    status: "APPROVED",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
    loadRelations();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payouts");
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadRelations = async () => {
    try {
      const [cRes, oRes, vRes] = await Promise.all([
        fetch("/api/creators"),
        fetch("/api/orders"),
        fetch("/api/videos"),
      ]);
      if (cRes.ok && oRes.ok && vRes.ok) {
        const cData = await cRes.json();
        const oData = await oRes.json();
        const vData = await vRes.json();
        setCreators(cData.creators || []);
        setOrders(oData.orders || []);
        setVideos(vData.videos || []);
        if (cData.creators?.length > 0 && oData.orders?.length > 0 && vData.videos?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            creatorId: cData.creators[0].id,
            orderId: oData.orders[0].id,
            videoId: vData.videos[0].id,
            contractedRate: cData.creators[0].rates || 250,
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoCount: Number(formData.videoCount),
          contractedRate: Number(formData.contractedRate),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create payout");
      }

      setIsModalOpen(false);
      fetchPayouts();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const totalPayoutsSum = payouts.reduce((acc, p) => acc + p.totalPayout, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Creator Compensation & Payouts</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Strict duplicate payout prevention guard ensures creators are compensated exactly once per video.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Issue Creator Payout
        </Button>
      </div>

      {/* Summary Strip */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 text-xs font-mono">
        <span className="text-zinc-400">Total Creator Compensation Disbursed:</span>
        <span className="text-lg font-bold text-sky-400">{formatCurrency(totalPayoutsSum)}</span>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
            <tr>
              <th className="py-3.5 px-4">Creator</th>
              <th className="py-3.5 px-4">Brand / Order</th>
              <th className="py-3.5 px-4">Rate & Count</th>
              <th className="py-3.5 px-4">Total Payout</th>
              <th className="py-3.5 px-4">Bank / UPI Ref</th>
              <th className="py-3.5 px-4">Payment Date</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center text-zinc-500">Loading payout records...</td></tr>
            ) : payouts.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-zinc-500">No payouts created yet.</td></tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-200">{p.creator?.name}</div>
                    <div className="text-[11px] text-zinc-500">{p.creator?.phone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">
                    <div>{p.order?.client?.companyName}</div>
                    <div className="text-[11px] text-zinc-500">{p.order?.packageName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400">
                    {formatCurrency(p.contractedRate)} × {p.videoCount}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                    {formatCurrency(p.totalPayout)}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                    <div>{p.creator?.bankDetails || "—"}</div>
                    {p.transactionRef && <span className="text-zinc-500">({p.transactionRef})</span>}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">{formatDate(p.paymentDate)}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={p.status === "PAID" ? "success" : "amber"}>{p.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* New Payout Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Disburse Creator Compensation"
        description="Duplicate payouts for the same completed video are strictly blocked by database constraints."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreatePayout} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Creator *</label>
            <select
              required
              value={formData.creatorId}
              onChange={(e) => {
                const sel = creators.find((c) => c.id === e.target.value);
                setFormData({
                  ...formData,
                  creatorId: e.target.value,
                  contractedRate: sel?.rates || 250,
                });
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatCurrency(c.rates)}/video)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Order *</label>
            <select
              required
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.client?.companyName} — {o.packageName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Video Slot *</label>
            <select
              required
              value={formData.videoId}
              onChange={(e) => setFormData({ ...formData, videoId: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  VID-{v.id.slice(-6)} ({v.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Contracted Rate ($) *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.contractedRate}
                onChange={(e) => setFormData({ ...formData, contractedRate: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">UPI / Wire Ref ID</label>
              <input
                type="text"
                value={formData.transactionRef}
                onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                placeholder="UPI-123456"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Approve & Issue Payout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
