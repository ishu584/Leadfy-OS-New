import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { RecordPaymentSchema } from "@/schemas/finance";
import { logActivity, createNotification } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role === "CLIENT") {
      assertPermission(session, "portal:access");
    } else {
      assertPermission(session, "payments:read");
    }

    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const orderId = searchParams.get("orderId");

    const where: any = {};
    if (session.role === "CLIENT") {
      where.clientId = session.clientId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (orderId) where.orderId = orderId;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        client: { select: { id: true, name: true, companyName: true, brandName: true } },
        order: { select: { id: true, packageName: true, totalAmount: true } },
      },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payments" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "payments:write");

    const body = await req.json();
    const parsed = RecordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Strict validation: Amount received cannot exceed invoice amount
    if (data.amountReceived > data.invoiceAmount) {
      return NextResponse.json(
        { error: "Amount received cannot exceed the invoice amount" },
        { status: 422 }
      );
    }

    const pendingBalance = Math.max(0, data.invoiceAmount - data.amountReceived);

    let status: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";
    if (data.amountReceived >= data.invoiceAmount) {
      status = "PAID";
    } else if (data.amountReceived > 0) {
      status = "PARTIALLY_PAID";
    }

    // Atomic transaction: Create payment and update Order totals
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: data.orderId,
          clientId: data.clientId,
          invoiceAmount: data.invoiceAmount,
          amountReceived: data.amountReceived,
          pendingBalance,
          paymentDate: new Date(data.paymentDate),
          paymentMethod: data.paymentMethod,
          transactionRef: data.transactionRef,
          notes: data.notes,
          status,
        },
        include: { client: true, order: true },
      });

      // Update Order amountReceived & outstandingBalance
      const orderPayments = await tx.payment.findMany({
        where: { orderId: data.orderId },
      });
      const totalReceived = orderPayments.reduce((acc, p) => acc + p.amountReceived, 0);
      const orderBalance = Math.max(0, payment.order.totalAmount - totalReceived);

      await tx.order.update({
        where: { id: data.orderId },
        data: {
          amountReceived: totalReceived,
          outstandingBalance: orderBalance,
        },
      });

      return payment;
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "PAYMENT_RECORDED",
      entityType: "PAYMENT",
      entityId: result.id,
      metadata: {
        orderId: data.orderId,
        amountReceived: data.amountReceived,
        pendingBalance,
        status,
      },
    });

    // Notify Owner
    const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
    if (owner && owner.id !== session.id) {
      await createNotification({
        recipientId: owner.id,
        type: "PAYMENT_RECORDED",
        title: `Payment Recorded ($${data.amountReceived.toLocaleString()})`,
        message: `Payment of $${data.amountReceived} received from ${result.client.companyName}.`,
        entityType: "PAYMENT",
        entityId: result.id,
      });
    }

    return NextResponse.json({ success: true, payment: result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record payment" },
      { status: error.statusCode || 500 }
    );
  }
}
