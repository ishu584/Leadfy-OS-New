import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission, canAccessClient } from "@/lib/rbac";
import { UpdateVideoSchema, isValidVideoTransition } from "@/schemas/video";
import { logActivity, createNotification } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        client: true,
        order: true,
        script: true,
        creator: true,
        shoot: true,
        assignedEditor: { select: { id: true, name: true, email: true } },
        feedbacks: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!canAccessClient(session, video.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ video });
  } catch (error: any) {
    console.error("GET /api/videos/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch video" },
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
    assertPermission(session, "videos:edit");
    const { id } = await context.params;

    const current = await prisma.video.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = UpdateVideoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate 9-stage video transition
    if (data.status && data.status !== current.status) {
      if (!isValidVideoTransition(current.status, data.status)) {
        return NextResponse.json(
          {
            error: `Invalid transition from ${current.status} to ${data.status}. Videos cannot be marked DELIVERED without prior FINAL_APPROVED state.`,
          },
          { status: 422 }
        );
      }
    }

    const deliveredAt = data.status === "DELIVERED" ? new Date() : undefined;
    const finalApprovedAt = data.status === "FINAL_APPROVED" ? new Date() : undefined;

    const updated = await prisma.video.update({
      where: { id },
      data: {
        assignedEditorId: data.assignedEditorId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        rawFootageUrl: data.rawFootageUrl,
        editDraftUrl: data.editDraftUrl,
        thumbnail: data.thumbnail,
        finalDeliveryUrl: data.finalDeliveryUrl,
        status: data.status,
        deliveredAt,
        finalApprovedAt,
      },
      include: { client: true, assignedEditor: true },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: data.status ? `VIDEO_STATUS_${data.status}` : "VIDEO_UPDATED",
      entityType: "VIDEO",
      entityId: id,
      metadata: { previousStatus: current.status, newStatus: data.status },
    });

    // If moved to CLIENT_REVIEW, notify the client
    if (data.status === "CLIENT_REVIEW" && updated.client.userId) {
      await createNotification({
        recipientId: updated.client.userId,
        type: "VIDEO_READY_FOR_REVIEW",
        title: "Video Ready for Review",
        message: "A new video cut is ready for your review and feedback.",
        entityType: "VIDEO",
        entityId: updated.id,
      });
    }

    return NextResponse.json({ success: true, video: updated });
  } catch (error: any) {
    console.error("PATCH /api/videos/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update video" },
      { status: error.statusCode || 500 }
    );
  }
}
