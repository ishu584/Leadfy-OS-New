"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, DollarSign, Receipt, Users, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [profitData, setProfitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetchFinancialReports();
  }, []);

  const fetchFinancialReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finances/profit");
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setProfitData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (forbidden) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-200">Access Restricted</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Financial statements and net profit analytics are strictly restricted to Owner and Admin roles.
        </p>
      </div>
    );
  }

  if (loading || !profitData) {
    return <div className="text-center py-12 text-xs text-zinc-500">Computing real-time agency profit analytics...</div>;
  }

  const {
    totalRevenue,
    totalInvoiced,
    totalPendingReceivables,
    totalExpenses,
    totalPaidPayouts,
    netProfit,
    profitMargin,
    expensesByCategory,
  } = profitData;

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" /> Executive Financial & Net Profit Report
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Authoritative database calculation: <code className="font-mono text-amber-400">Net Profit = Revenue - Expenses - Creator Payouts</code>
        </p>
      </div>

      {/* Primary Profit Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block">Total Revenue Collected</span>
          <p className="text-2xl font-bold text-zinc-100 mt-1 font-mono">{formatCurrency(totalRevenue)}</p>
          <span className="text-[10px] text-zinc-500 mt-0.5 block">From Invoiced: {formatCurrency(totalInvoiced)}</span>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block">Total Agency Expenses</span>
          <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">{formatCurrency(totalExpenses)}</p>
          <span className="text-[10px] text-zinc-500 mt-0.5 block">Studio, Office, Tech & Gear</span>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block">Creator Compensation</span>
          <p className="text-2xl font-bold text-sky-400 mt-1 font-mono">{formatCurrency(totalPaidPayouts)}</p>
          <span className="text-[10px] text-zinc-500 mt-0.5 block">Disbursed talent payouts</span>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Net Agency Profit
          </span>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1 font-mono">{formatCurrency(netProfit)}</p>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Profit Margin: {profitMargin}</span>
        </Card>
      </div>

      {/* Expense Categorical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" /> Operational Expense Distribution
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {Object.entries(expensesByCategory || {}).map(([cat, amount]: [string, any]) => {
              const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">{cat}</span>
                    <span className="text-zinc-400">{formatCurrency(amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" /> Cashflow Balance Status
            </CardTitle>
          </CardHeader>
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-zinc-400 block text-[11px]">Uncollected Balance</span>
                <span className="text-base font-bold text-yellow-400">{formatCurrency(totalPendingReceivables)}</span>
              </div>
              <Badge variant="warning">Receivable</Badge>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-zinc-400 block text-[11px]">Gross Invoiced Volume</span>
                <span className="text-base font-bold text-zinc-100">{formatCurrency(totalInvoiced)}</span>
              </div>
              <Badge variant="neutral">Committed</Badge>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-zinc-400 block text-[11px]">Disbursed Payouts</span>
                <span className="text-base font-bold text-sky-400">{formatCurrency(totalPaidPayouts)}</span>
              </div>
              <Badge variant="info">Settled</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
