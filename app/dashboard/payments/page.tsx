"use client";

import React, { useState, useEffect } from "react";
import { Plus, CreditCard, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    orderId: "",
    clientId: "",
    invoiceAmount: 2500,
    amountReceived: 2500,
    paymentMethod: "Bank Wire Transfer",
    transactionRef: "",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    loadOrdersAndClients();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersAndClients = async () => {
    try {
      const [oRes, cRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/clients?limit=100"),
      ]);
      if (oRes.ok && cRes.ok) {
        const oData = await oRes.json();
        const cData = await cRes.json();
        setOrders(oData.orders || []);
        setClients(cData.clients || []);
        if (oData.orders?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            orderId: oData.orders[0].id,
            clientId: oData.orders[0].clientId,
            invoiceAmount: oData.orders[0].totalAmount,
            amountReceived: oData.orders[0].outstandingBalance || oData.orders[0].totalAmount,
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          invoiceAmount: Number(formData.invoiceAmount),
          amountReceived: Number(formData.amountReceived),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to record payment");
      }

      setIsModalOpen(false);
      fetchPayments();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const totalInvoiced = payments.reduce((acc, p) => acc + p.invoiceAmount, 0);
  const totalReceived = payments.reduce((acc, p) => acc + p.amountReceived, 0);
  const totalOutstanding = payments.reduce((acc, p) => acc + p.pendingBalance, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Payments & Invoicing Desk</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Record client remittances, compute pending balances, and track revenue reconciliation.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Record New Payment
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Invoiced</p>
            <h4 className="text-xl font-bold text-zinc-100 mt-1">{formatCurrency(totalInvoiced)}</h4>
          </div>
          <CreditCard className="w-8 h-8 text-zinc-600" />
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Collected Revenue</p>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalReceived)}</h4>
          </div>
          <DollarSign className="w-8 h-8 text-emerald-500/40" />
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Pending Receivables</p>
            <h4 className="text-xl font-bold text-yellow-400 mt-1">{formatCurrency(totalOutstanding)}</h4>
          </div>
          <AlertCircle className="w-8 h-8 text-yellow-500/40" />
        </Card>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Client & Order</th>
                <th className="py-3.5 px-4">Invoice Amount</th>
                <th className="py-3.5 px-4">Amount Received</th>
                <th className="py-3.5 px-4">Outstanding Balance</th>
                <th className="py-3.5 px-4">Method & Ref</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-zinc-500">Loading payment ledger...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-zinc-500">No payments recorded.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{p.client?.companyName}</div>
                      <div className="text-[11px] text-zinc-400">{p.order?.packageName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">{formatCurrency(p.invoiceAmount)}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">{formatCurrency(p.amountReceived)}</td>
                    <td className="py-3.5 px-4 font-mono text-yellow-400">{formatCurrency(p.pendingBalance)}</td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      <div>{p.paymentMethod}</div>
                      {p.transactionRef && <div className="text-[10px] text-zinc-500 font-mono">{p.transactionRef}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{formatDate(p.paymentDate)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status === "PAID" ? "success" : "warning"}>{p.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment Remittance"
        description="Pending balance is automatically computed from Invoice Amount - Amount Received."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {formError}
          </div>
        )}
        <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Select Order *</label>
            <select
              required
              value={formData.orderId}
              onChange={(e) => {
                const sel = orders.find((o) => o.id === e.target.value);
                setFormData({
                  ...formData,
                  orderId: e.target.value,
                  clientId: sel?.clientId || "",
                  invoiceAmount: sel?.totalAmount || 0,
                  amountReceived: sel?.outstandingBalance || sel?.totalAmount || 0,
                });
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.client?.companyName} — {o.packageName} ({formatCurrency(o.totalAmount)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Invoice Amount ($) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.invoiceAmount}
                onChange={(e) => setFormData({ ...formData, invoiceAmount: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Amount Received ($) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.amountReceived}
                onChange={(e) => setFormData({ ...formData, amountReceived: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Payment Method *</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Bank Wire Transfer">Bank Wire Transfer</option>
                <option value="Stripe / Card">Stripe / Card</option>
                <option value="UPI">UPI</option>
                <option value="PayPal">PayPal</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Transaction Ref ID</label>
              <input
                type="text"
                value={formData.transactionRef}
                onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                placeholder="e.g. TXN-192837"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Record Remittance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
