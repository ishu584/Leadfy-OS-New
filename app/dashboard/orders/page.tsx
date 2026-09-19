"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Package, AlertCircle, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Create Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    packageName: "",
    contractedVideoCount: 10,
    pricing: 2500,
    taxAmount: 450,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "NEW",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/orders${q}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients?limit=100");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
        if (data.clients?.length > 0 && !formData.clientId) {
          setFormData((prev) => ({ ...prev, clientId: data.clients[0].id }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contractedVideoCount: Number(formData.contractedVideoCount),
          pricing: Number(formData.pricing),
          taxAmount: Number(formData.taxAmount),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create order");
      }

      setIsModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Orders & Package Commitments</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Commercial orders, video production quota counters, and payment balance tracking.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Commercial Order
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Order Statuses</option>
            <option value="NEW">New</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <span className="text-xs text-zinc-500 font-mono">{orders.length} active commitments</span>
      </div>

      {/* Orders Table with Production Counters */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Client & Package</th>
                <th className="py-3.5 px-4">Production Quota Counter</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Received / Balance</th>
                <th className="py-3.5 px-4">Delivery Timeline</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500">No orders found.</td></tr>
              ) : (
                orders.map((o) => {
                  const counters = o.productionCounters;
                  const percentComplete = counters.orderedVideos > 0
                    ? Math.round((counters.completedVideos / counters.orderedVideos) * 100)
                    : 0;

                  return (
                    <tr key={o.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-amber-400" />
                          {o.packageName}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{o.client?.companyName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-zinc-300">
                              {counters.completedVideos} / {counters.orderedVideos} Done
                            </span>
                            <span className="text-amber-400 font-bold">{percentComplete}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentComplete}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-zinc-500 flex gap-2">
                            <span>Assigned: {counters.assignedVideos}</span>
                            <span>•</span>
                            <span>Remaining Quota: {counters.remainingQuota}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-zinc-100">
                        {formatCurrency(o.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-emerald-400 font-medium">
                          {formatCurrency(o.amountReceived)}
                        </div>
                        {o.outstandingBalance > 0 ? (
                          <div className="text-[11px] font-mono text-yellow-400 mt-0.5">
                            Bal: {formatCurrency(o.outstandingBalance)}
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-emerald-500 mt-0.5">Paid in Full</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px] font-mono">
                        {formatDate(o.startDate)} – {formatDate(o.dueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="amber">{o.status}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Commercial Order"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Select Client Account *</label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Package Name *</label>
            <input
              type="text"
              required
              value={formData.packageName}
              onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
              placeholder="e.g. Growth UGC Bundle (10 Videos)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Contracted Videos *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.contractedVideoCount}
                onChange={(e) => setFormData({ ...formData, contractedVideoCount: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Base Price ($) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.pricing}
                onChange={(e) => setFormData({ ...formData, pricing: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Tax / GST ($)</label>
              <input
                type="number"
                min="0"
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Commit Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
