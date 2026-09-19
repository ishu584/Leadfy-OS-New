import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canAccessClient } from "@/lib/rbac";
import { logActivity, createNotification } from "@/lib/audit";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { client: true, assignedEditor: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!canAccessClient(session, video.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Must be in CLIENT_REVIEW or REVISION to approve
    if (!["CLIENT_REVIEW", "REVISION", "INTERNAL_QA"].includes(video.status)) {
      return NextResponse.json(
        { error: `Cannot approve video while in status ${video.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.video.update({
      where: { id },
      data: {
        status: "FINAL_APPROVED",
        finalApprovedAt: new Date(),
      },
      include: { client: true, assignedEditor: true },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "VIDEO_FINAL_APPROVED",
      entityType: "VIDEO",
      entityId: id,
      metadata: { approvedBy: session.name },
    });

    // Notify editor and admin
    if (updated.assignedEditorId) {
      await createNotification({
        recipientId: updated.assignedEditorId,
        type: "VIDEO_FINAL_APPROVED",
        title: "Video Approved by Client!",
        message: `Final cut for ${updated.client.companyName} was approved. Ready for final delivery packaging.`,
        entityType: "VIDEO",
        entityId: id,
      });
    }

    return NextResponse.json({
      success: true,
      video: updated,
      message: "Video approved successfully. Ready for final delivery.",
    });
  } catch (error: any) {
    console.error("POST /api/videos/[id]/approve error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve video" },
      { status: error.statusCode || 500 }
    );
  }
}
