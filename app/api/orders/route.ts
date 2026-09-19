import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { CreateOrderSchema } from "@/schemas/order";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role === "CLIENT") {
      assertPermission(session, "portal:access");
    } else {
      assertPermission(session, "orders:read");
    }

    const searchParams = req.nextUrl.searchParams;
    const clientIdParam = searchParams.get("clientId");
    const statusParam = searchParams.get("status");

    const where: any = {};
    // Strict client isolation
    if (session.role === "CLIENT") {
      where.clientId = session.clientId;
    } else if (clientIdParam) {
      where.clientId = clientIdParam;
    }

    if (statusParam) {
      where.status = statusParam;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true, companyName: true, brandName: true },
        },
        videos: {
          select: { id: true, status: true },
        },
        _count: {
          select: { scripts: true, shoots: true },
        },
      },
    });

    // Derive authoritative production counters for each order
    const ordersWithCounters = orders.map((order) => {
      const orderedVideos = order.contractedVideoCount;
      const assignedVideos = order.videos.length;
      const completedVideos = order.videos.filter((v) =>
        ["FINAL_APPROVED", "DELIVERED"].includes(v.status)
      ).length;
      const deliveredVideos = order.videos.filter((v) => v.status === "DELIVERED").length;
      const remainingQuota = Math.max(0, orderedVideos - completedVideos);

      return {
        ...order,
        productionCounters: {
          orderedVideos,
          assignedVideos,
          completedVideos,
          deliveredVideos,
          remainingQuota,
        },
      };
    });

    return NextResponse.json({ orders: ordersWithCounters });
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "orders:write");

    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const totalAmount = data.pricing + (data.taxAmount || 0);
    const amountReceived = 0;
    const outstandingBalance = totalAmount - amountReceived;

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          clientId: data.clientId,
          packageName: data.packageName,
          contractedVideoCount: data.contractedVideoCount,
          pricing: data.pricing,
          taxAmount: data.taxAmount || 0,
          totalAmount,
          amountReceived,
          outstandingBalance,
          startDate: new Date(data.startDate),
          dueDate: new Date(data.dueDate),
          assignedTeamId: data.assignedTeamId,
          status: data.status,
        },
        include: {
          client: true,
        },
      });

      // Create initial Unpaid payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          clientId: order.clientId,
          invoiceAmount: totalAmount,
          amountReceived: 0,
          pendingBalance: totalAmount,
          paymentMethod: "Pending",
          status: "UNPAID",
        },
      });

      return order;
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "ORDER_CREATED",
      entityType: "ORDER",
      entityId: newOrder.id,
      metadata: {
        packageName: newOrder.packageName,
        contractedVideos: newOrder.contractedVideoCount,
        totalAmount,
      },
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: error.statusCode || 500 }
    );
  }
}
