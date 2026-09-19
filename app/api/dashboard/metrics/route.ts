import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireAuth();

    // Client Dashboard
    if (session.role === "CLIENT") {
      if (!session.clientId) {
        return NextResponse.json({ clientOverview: null });
      }

      const [orders, scripts, videos, payments, openTickets] = await Promise.all([
        prisma.order.findMany({ where: { clientId: session.clientId } }),
        prisma.script.findMany({ where: { clientId: session.clientId } }),
        prisma.video.findMany({ where: { clientId: session.clientId } }),
        prisma.payment.findMany({ where: { clientId: session.clientId } }),
        prisma.supportTicket.count({ where: { clientId: session.clientId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      ]);

      const totalContracted = orders.reduce((sum, o) => sum + o.contractedVideoCount, 0);
      const deliveredCount = videos.filter((v) => v.status === "DELIVERED").length;
      const inReviewCount = videos.filter((v) => v.status === "CLIENT_REVIEW").length;
      const pendingScriptApproval = scripts.filter((s) => s.status === "SENT_TO_CLIENT").length;
      const totalPendingBalance = orders.reduce((sum, o) => sum + o.outstandingBalance, 0);

      return NextResponse.json({
        role: "CLIENT",
        metrics: {
          activeOrdersCount: orders.filter((o) => ["NEW", "ONBOARDING", "IN_PRODUCTION"].includes(o.status)).length,
          totalContracted,
          deliveredCount,
          inReviewCount,
          pendingScriptApproval,
          totalPendingBalance,
          openTickets,
        },
      });
    }

    // Internal Dashboard (Owner, Admin, Employees)
    const canSeeFinancials = hasPermission(session, "dashboard:financials");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [
      activeClientsCount,
      newClientsCount,
      activeOrdersCount,
      pendingScriptsCount,
      upcomingShootsCount,
      todayShoots,
      urgentTasks,
      pendingClientVideoApprovals,
      videoPipelineBreakdown,
      recentPayments,
      recentActivity,
    ] = await Promise.all([
      prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.client.count({ where: { status: "NEW" } }),
      prisma.order.count({ where: { status: { in: ["NEW", "ONBOARDING", "IN_PRODUCTION"] } } }),
      prisma.script.count({ where: { status: { in: ["DRAFT", "ASSIGNED", "IN_REVIEW"] } } }),
      prisma.shoot.count({ where: { shootDate: { gte: now }, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
      prisma.shoot.findMany({
        where: { shootDate: { gte: startOfToday, lte: endOfToday } },
        include: { creator: true, client: true },
      }),
      prisma.task.findMany({
        where: { priority: "URGENT", status: { not: "DONE" } },
        include: { assignee: true },
        take: 5,
      }),
      prisma.video.findMany({
        where: { status: "CLIENT_REVIEW" },
        include: { client: true, assignedEditor: true },
        take: 5,
      }),
      prisma.video.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.payment.findMany({
        orderBy: { paymentDate: "desc" },
        take: 5,
        include: { client: true, order: true },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    // Financial KPIs for Owner/Admin only
    let financialKPIs = null;
    if (canSeeFinancials) {
      const [payments, expenses, payouts] = await Promise.all([
        prisma.payment.findMany({ select: { amountReceived: true, invoiceAmount: true, pendingBalance: true } }),
        prisma.expense.findMany({ select: { amount: true } }),
        prisma.creatorPayout.findMany({ where: { status: { in: ["APPROVED", "PAID"] } }, select: { totalPayout: true } }),
      ]);

      const totalRevenue = payments.reduce((acc, p) => acc + p.amountReceived, 0);
      const totalInvoiced = payments.reduce((acc, p) => acc + p.invoiceAmount, 0);
      const totalReceivables = payments.reduce((acc, p) => acc + p.pendingBalance, 0);
      const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
      const totalPayouts = payouts.reduce((acc, p) => acc + p.totalPayout, 0);
      const netProfit = totalRevenue - totalExpenses - totalPayouts;

      financialKPIs = {
        totalRevenue,
        totalInvoiced,
        totalReceivables,
        totalExpenses,
        totalPayouts,
        netProfit,
      };
    }

    // Format pipeline breakdown map
    const pipelineCounts: Record<string, number> = {};
    for (const item of videoPipelineBreakdown) {
      pipelineCounts[item.status] = item._count.id;
    }

    return NextResponse.json({
      role: session.role,
      employeeRole: session.employeeRole,
      metrics: {
        activeClientsCount,
        newClientsCount,
        activeOrdersCount,
        pendingScriptsCount,
        upcomingShootsCount,
      },
      pipelineCounts,
      financialKPIs,
      todayShoots,
      urgentTasks,
      pendingClientVideoApprovals,
      recentPayments: canSeeFinancials ? recentPayments : [],
      recentActivity,
    });
  } catch (error: any) {
    console.error("GET /api/dashboard/metrics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard metrics" },
      { status: error.statusCode || 500 }
    );
  }
}
