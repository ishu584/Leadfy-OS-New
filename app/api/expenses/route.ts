import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { CreateExpenseSchema } from "@/schemas/finance";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "expenses:read");

    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");

    const where: any = {};
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch expenses" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "expenses:write");

    const body = await req.json();
    const parsed = CreateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        recordedById: session.id,
      },
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "EXPENSE_LOGGED",
      entityType: "EXPENSE",
      entityId: expense.id,
      metadata: { category: expense.category, amount: expense.amount },
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record expense" },
      { status: error.statusCode || 500 }
    );
  }
}
