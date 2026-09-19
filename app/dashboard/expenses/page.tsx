"use client";

import React, { useState, useEffect } from "react";
import { Plus, Receipt, DollarSign, Filter, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  // Log Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "STUDIO",
    amount: 300,
    date: new Date().toISOString().slice(0, 10),
    receiptUrl: "",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = categoryFilter ? `?category=${categoryFilter}` : "";
      const res = await fetch(`/api/expenses${q}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchExpenses();
      }
    } catch {
      // ignore
    } finally {
      setFormLoading(false);
    }
  };

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Agency Expenses Ledger</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Operational expenses categorized by Studio, Equipment, Office, Fuel, and Salaries.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Log Expense
        </Button>
      </div>

      {/* Filter & Summary Bar */}
      <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Categories</option>
            <option value="SALARIES">Salaries</option>
            <option value="OFFICE">Office</option>
            <option value="STUDIO">Studio</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="FUEL">Fuel</option>
            <option value="PAYOUTS">Payouts</option>
          </select>
        </div>
        <div className="text-xs font-mono">
          <span className="text-zinc-500">Filtered Total: </span>
          <span className="font-bold text-rose-400">{formatCurrency(totalExpenseAmount)}</span>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase font-semibold">
            <tr>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Notes & Purpose</th>
              <th className="py-3.5 px-4">Logged By</th>
              <th className="py-3.5 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-zinc-500">Loading expenses...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-zinc-500">No expenses recorded.</td></tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    <Badge variant="amber">{exp.category}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300 max-w-sm truncate">{exp.notes || "—"}</td>
                  <td className="py-3.5 px-4 text-zinc-400">{exp.recordedBy?.name}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">{formatDate(exp.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Log Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Agency Operational Expense"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Expense Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="STUDIO">Studio</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="OFFICE">Office</option>
                <option value="FUEL">Fuel</option>
                <option value="SALARIES">Salaries</option>
                <option value="PAYOUTS">Payouts</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Amount ($) *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Notes & Description</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Studio 4A rental, lighting batteries, Uber travel receipt..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Log Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
