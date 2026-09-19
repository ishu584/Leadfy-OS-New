import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { z } from "zod";
import { logActivity, createNotification } from "@/lib/audit";

const CreateTicketSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(5, "Message is required"),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  clientId: z.string().optional(), // Inferred for clients
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: any = {};
    if (session.role === "CLIENT") {
      if (!session.clientId) {
        return NextResponse.json({ tickets: [] });
      }
      where.clientId = session.clientId;
    } else {
      assertPermission(session, "tickets:read");
      const clientFilter = searchParams.get("clientId");
      if (clientFilter) where.clientId = clientFilter;
    }

    if (status) where.status = status;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, companyName: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("GET /api/tickets error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tickets" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = CreateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let targetClientId = session.clientId;
    if (session.role !== "CLIENT") {
      if (!data.clientId) {
        return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
      }
      targetClientId = data.clientId;
    }

    if (!targetClientId) {
      return NextResponse.json({ error: "No client profile associated with user" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        clientId: targetClientId,
        subject: data.subject,
        message: data.message,
        priority: data.priority,
        status: "OPEN",
      },
      include: {
        client: true,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "TICKET_CREATED",
      entityType: "SUPPORT_TICKET",
      entityId: ticket.id,
      metadata: { subject: ticket.subject, priority: ticket.priority },
    });

    // Notify Operations Admin
    const admin = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "OWNER"] } } });
    if (admin) {
      await createNotification({
        recipientId: admin.id,
        type: "SUPPORT_TICKET_OPENED",
        title: "New Support Ticket",
        message: `${ticket.client.companyName} opened ticket: "${ticket.subject}"`,
        entityType: "SUPPORT_TICKET",
        entityId: ticket.id,
      });
    }

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tickets error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create support ticket" },
      { status: error.statusCode || 500 }
    );
  }
}
