import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireAuth();
    // Only Owner and Admin can access financial metrics
    assertPermission(session, "dashboard:financials");

    const [payments, expenses, creatorPayouts] = await Promise.all([
      prisma.payment.findMany({ select: { amountReceived: true, invoiceAmount: true, pendingBalance: true } }),
      prisma.expense.findMany({ select: { amount: true, category: true } }),
      prisma.creatorPayout.findMany({ select: { totalPayout: true, status: true } }),
    ]);

    // Total actual revenue received
    const totalRevenue = payments.reduce((acc, p) => acc + p.amountReceived, 0);
    const totalInvoiced = payments.reduce((acc, p) => acc + p.invoiceAmount, 0);
    const totalPendingReceivables = payments.reduce((acc, p) => acc + p.pendingBalance, 0);

    // Total expenses logged
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // Total payouts (approved and paid)
    const totalPaidPayouts = creatorPayouts
      .filter((p) => ["APPROVED", "PAID"].includes(p.status))
      .reduce((acc, p) => acc + p.totalPayout, 0);

    // Dynamic Net Profit calculation
    const netProfit = totalRevenue - totalExpenses - totalPaidPayouts;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

    // Expense breakdown by category
    const expensesByCategory: Record<string, number> = {};
    for (const exp of expenses) {
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
    }

    return NextResponse.json({
      totalRevenue,
      totalInvoiced,
      totalPendingReceivables,
      totalExpenses,
      totalPaidPayouts,
      netProfit,
      profitMargin: `${profitMargin}%`,
      expensesByCategory,
    });
  } catch (error: any) {
    console.error("GET /api/finances/profit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate profit" },
      { status: error.statusCode || 500 }
    );
  }
}
