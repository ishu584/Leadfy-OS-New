import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canAccessClient } from "@/lib/rbac";
import { logActivity } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!canAccessClient(session, ticket.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error("GET /api/tickets/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ticket" },
      { status: error.statusCode || 500 }
    );
  }
}

// Add reply to ticket
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!canAccessClient(session, ticket.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { message, status } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const reply = await prisma.$transaction(async (tx) => {
      const resp = await tx.ticketResponse.create({
        data: {
          ticketId: id,
          authorId: session.id,
          authorName: session.name,
          authorRole: session.role === "EMPLOYEE" ? session.employeeRole || "EMPLOYEE" : session.role,
          message: message.trim(),
        },
      });

      if (status && ["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
        await tx.supportTicket.update({
          where: { id },
          data: { status },
        });
      }

      return resp;
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "TICKET_REPLIED",
      entityType: "SUPPORT_TICKET",
      entityId: id,
      metadata: { statusChange: status || ticket.status },
    });

    return NextResponse.json({ success: true, response: reply }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tickets/[id] reply error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit response" },
      { status: error.statusCode || 500 }
    );
  }
}
