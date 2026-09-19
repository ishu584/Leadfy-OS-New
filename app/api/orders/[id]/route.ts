import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission, canAccessClient } from "@/lib/rbac";
import { UpdateOrderSchema, isValidOrderTransition } from "@/schemas/order";
import { logActivity } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        scripts: {
          include: { writer: true, creator: true },
        },
        shoots: {
          include: { creator: true },
        },
        videos: {
          include: { assignedEditor: true, feedbacks: true },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!canAccessClient(session, order.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Derive authoritative production counters
    const orderedVideos = order.contractedVideoCount;
    const assignedVideos = order.videos.length;
    const completedVideos = order.videos.filter((v) =>
      ["FINAL_APPROVED", "DELIVERED"].includes(v.status)
    ).length;
    const deliveredVideos = order.videos.filter((v) => v.status === "DELIVERED").length;
    const remainingQuota = Math.max(0, orderedVideos - completedVideos);

    return NextResponse.json({
      order: {
        ...order,
        productionCounters: {
          orderedVideos,
          assignedVideos,
          completedVideos,
          deliveredVideos,
          remainingQuota,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch order" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    assertPermission(session, "orders:write");
    const { id } = await context.params;

    const body = await req.json();
    const parsed = UpdateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const currentOrder = await prisma.order.findUnique({ where: { id } });
    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = parsed.data;

    // Validate status transition
    if (data.status && data.status !== currentOrder.status) {
      if (!isValidOrderTransition(currentOrder.status, data.status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${currentOrder.status} to ${data.status}`,
          },
          { status: 422 }
        );
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        packageName: data.packageName,
        contractedVideoCount: data.contractedVideoCount,
        pricing: data.pricing,
        taxAmount: data.taxAmount,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedTeamId: data.assignedTeamId,
        status: data.status,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "ORDER_UPDATED",
      entityType: "ORDER",
      entityId: id,
      metadata: data,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: error.statusCode || 500 }
    );
  }
}
