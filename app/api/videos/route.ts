import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { CreateVideoSchema } from "@/schemas/video";
import { logActivity, createNotification } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role === "CLIENT") {
      assertPermission(session, "portal:access");
    } else {
      assertPermission(session, "videos:read");
    }

    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const orderId = searchParams.get("orderId");
    const editorId = searchParams.get("editorId");
    const status = searchParams.get("status");

    const where: any = {};
    if (session.role === "CLIENT") {
      where.clientId = session.clientId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    // For EDITOR role, can filter to own assignments
    if (session.role === "EMPLOYEE" && session.employeeRole === "EDITOR") {
      if (searchParams.get("assignedOnly") === "true" || !editorId) {
        where.assignedEditorId = session.id;
      }
    } else if (editorId) {
      where.assignedEditorId = editorId;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      include: {
        client: { select: { id: true, name: true, companyName: true, brandName: true } },
        order: { select: { id: true, packageName: true } },
        script: { select: { id: true, videoNumber: true, language: true, scriptText: true } },
        creator: { select: { id: true, name: true } },
        assignedEditor: { select: { id: true, name: true, email: true } },
        feedbacks: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error("GET /api/videos error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch videos" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "videos:edit");

    const body = await req.json();
    const parsed = CreateVideoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const video = await prisma.video.create({
      data: {
        clientId: data.clientId,
        orderId: data.orderId,
        scriptId: data.scriptId,
        creatorId: data.creatorId,
        shootId: data.shootId,
        assignedEditorId: data.assignedEditorId,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status,
      },
      include: {
        client: true,
        order: true,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "VIDEO_CREATED",
      entityType: "VIDEO",
      entityId: video.id,
      metadata: { orderId: video.orderId, status: video.status },
    });

    if (video.assignedEditorId) {
      await createNotification({
        recipientId: video.assignedEditorId,
        type: "VIDEO_ASSIGNED",
        title: "Video Assigned for Editing",
        message: `You were assigned a new video edit for ${video.client.companyName}.`,
        entityType: "VIDEO",
        entityId: video.id,
      });
    }

    return NextResponse.json({ success: true, video }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/videos error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create video" },
      { status: error.statusCode || 500 }
    );
  }
}
