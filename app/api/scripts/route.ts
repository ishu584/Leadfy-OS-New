import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { CreateScriptSchema } from "@/schemas/script";
import { logActivity, createNotification } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role === "CLIENT") {
      assertPermission(session, "portal:access");
    } else {
      assertPermission(session, "scripts:read");
    }

    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");

    const where: any = {};
    if (session.role === "CLIENT") {
      where.clientId = session.clientId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    // For SCRIPT_WRITER employee, optionally filter to assigned scripts if not admin/owner
    if (session.role === "EMPLOYEE" && session.employeeRole === "SCRIPT_WRITER" && searchParams.get("assignedOnly") === "true") {
      where.writerId = session.id;
    }

    const scripts = await prisma.script.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { videoNumber: "asc" }],
      include: {
        client: { select: { id: true, name: true, companyName: true, brandName: true } },
        order: { select: { id: true, packageName: true } },
        writer: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({ scripts });
  } catch (error: any) {
    console.error("GET /api/scripts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scripts" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "scripts:write");

    const body = await req.json();
    const parsed = CreateScriptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const script = await prisma.script.create({
      data: {
        clientId: data.clientId,
        orderId: data.orderId,
        videoNumber: data.videoNumber,
        writerId: data.writerId || (session.role === "EMPLOYEE" && session.employeeRole === "SCRIPT_WRITER" ? session.id : null),
        creatorId: data.creatorId,
        language: data.language,
        scriptText: data.scriptText,
        referenceLinks: data.referenceLinks,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status,
      },
      include: {
        client: true,
        writer: true,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "SCRIPT_CREATED",
      entityType: "SCRIPT",
      entityId: script.id,
      metadata: { videoNumber: script.videoNumber, status: script.status },
    });

    if (script.writerId && script.writerId !== session.id) {
      await createNotification({
        recipientId: script.writerId,
        type: "SCRIPT_ASSIGNED",
        title: "New Script Assigned",
        message: `You were assigned to write Script #${script.videoNumber} for ${script.client.companyName}.`,
        entityType: "SCRIPT",
        entityId: script.id,
      });
    }

    return NextResponse.json({ success: true, script }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/scripts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create script" },
      { status: error.statusCode || 500 }
    );
  }
}
