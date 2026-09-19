import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission, canAccessClient } from "@/lib/rbac";
import { UpdateClientSchema } from "@/schemas/client";
import { logActivity } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    if (!canAccessClient(session, id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, email: true },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            videos: {
              select: { id: true, status: true },
            },
            payments: {
              select: { id: true, invoiceAmount: true, amountReceived: true, pendingBalance: true, status: true },
            },
          },
        },
        scripts: {
          orderBy: { createdAt: "desc" },
          include: {
            writer: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } },
          },
        },
        shoots: {
          orderBy: { shootDate: "desc" },
          include: {
            creator: { select: { id: true, name: true, phone: true } },
          },
        },
        videos: {
          orderBy: { createdAt: "desc" },
          include: {
            assignedEditor: { select: { id: true, name: true } },
            feedbacks: { orderBy: { createdAt: "desc" } },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
          include: { responses: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Include recent activity logs for authorized staff
    let activityLogs: any[] = [];
    if (session.role === "OWNER" || session.role === "ADMIN") {
      activityLogs = await prisma.activityLog.findMany({
        where: { entityType: "CLIENT", entityId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }

    return NextResponse.json({
      client: {
        ...client,
        company: client.companyName, // Canonical alias
      },
      activityLogs,
    });
  } catch (error: any) {
    console.error("GET /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch client details" },
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
    assertPermission(session, "clients:write");
    const { id } = await context.params;

    const body = await req.json();
    const parsed = UpdateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data,
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "CLIENT_UPDATED",
      entityType: "CLIENT",
      entityId: id,
      metadata: data,
    });

    return NextResponse.json({
      success: true,
      client: {
        ...updated,
        company: updated.companyName,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update client" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    assertPermission(session, "clients:delete");
    const { id } = await context.params;

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "CLIENT_DELETED",
      entityType: "CLIENT",
      entityId: id,
      metadata: { companyName: existing.companyName },
    });

    return NextResponse.json({ success: true, message: "Client removed" });
  } catch (error: any) {
    console.error("DELETE /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete client" },
      { status: error.statusCode || 500 }
    );
  }
}
