import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canAccessClient } from "@/lib/rbac";
import { ClientVideoFeedbackSchema } from "@/schemas/video";
import { logActivity, createNotification } from "@/lib/audit";

export async function POST(
  req: NextRequest,
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

    const body = await req.json();
    const parsed = ClientVideoFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { timestampCode, feedbackText, action } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create timestamped feedback entry
      const feedback = await tx.videoFeedback.create({
        data: {
          videoId: id,
          authorId: session.id,
          authorName: session.name,
          timestampCode,
          feedbackText,
          revisionNumber: video.revisionCount + (action === "REVISION_REQUESTED" ? 1 : 0),
        },
      });

      // 2. If requesting revision, increment revision count and return video to editor
      let updatedVideo = video;
      if (action === "REVISION_REQUESTED") {
        updatedVideo = await tx.video.update({
          where: { id },
          data: {
            status: "REVISION",
            revisionCount: { increment: 1 },
          },
          include: { client: true, assignedEditor: true },
        });
      }

      return { feedback, updatedVideo };
    });

    // 3. Log audit activity
    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: action === "REVISION_REQUESTED" ? "VIDEO_REVISION_REQUESTED" : "VIDEO_COMMENT_ADDED",
      entityType: "VIDEO",
      entityId: id,
      metadata: {
        timestamp: timestampCode,
        action,
        revisionCount: result.updatedVideo.revisionCount,
      },
    });

    // 4. Notify assigned editor
    if (result.updatedVideo.assignedEditorId) {
      await createNotification({
        recipientId: result.updatedVideo.assignedEditorId,
        type: "VIDEO_REVISION",
        title: action === "REVISION_REQUESTED" ? "Revision Requested" : "New Feedback on Video",
        message: `${session.name} submitted feedback at ${timestampCode}: "${feedbackText.slice(0, 80)}..."`,
        entityType: "VIDEO",
        entityId: id,
      });
    }

    return NextResponse.json({
      success: true,
      feedback: result.feedback,
      video: result.updatedVideo,
    });
  } catch (error: any) {
    console.error("POST /api/videos/[id]/feedback error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit feedback" },
      { status: error.statusCode || 500 }
    );
  }
}
