import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canAccessClient } from "@/lib/rbac";
import { UpdateScriptSchema, isValidScriptTransition } from "@/schemas/script";
import { logActivity, createNotification } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        client: true,
        order: true,
        writer: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, photo: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, role: true, employeeRole: true } },
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (!canAccessClient(session, script.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ script });
  } catch (error: any) {
    console.error("GET /api/scripts/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch script" },
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
    const { id } = await context.params;

    const current = await prisma.script.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (!canAccessClient(session, current.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateScriptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate status transition rule
    if (data.status && data.status !== current.status) {
      // Clients can only mark APPROVED or REVISION_REQUIRED when status is SENT_TO_CLIENT
      if (session.role === "CLIENT") {
        if (current.status !== "SENT_TO_CLIENT" || !["APPROVED", "REVISION_REQUIRED"].includes(data.status)) {
          return NextResponse.json(
            { error: "Clients may only approve or request revisions when script is sent to client." },
            { status: 403 }
          );
        }
      } else {
        if (!isValidScriptTransition(current.status, data.status)) {
          return NextResponse.json(
            { error: `Invalid transition from ${current.status} to ${data.status}. Cannot set READY_FOR_SHOOT without prior approval.` },
            { status: 422 }
          );
        }
      }
    }

    // Auto-increment revision count if requested revision
    const incrementRevision = data.status === "REVISION_REQUIRED";

    const updated = await prisma.script.update({
      where: { id },
      data: {
        writerId: data.writerId,
        creatorId: data.creatorId,
        language: data.language,
        scriptText: data.scriptText,
        referenceLinks: data.referenceLinks,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status: data.status,
        revisionCount: incrementRevision ? { increment: 1 } : undefined,
      },
      include: {
        client: true,
        writer: true,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: data.status ? `SCRIPT_STATUS_${data.status}` : "SCRIPT_UPDATED",
      entityType: "SCRIPT",
      entityId: id,
      metadata: { previousStatus: current.status, newStatus: data.status },
    });

    if (data.status === "APPROVED" && updated.writerId) {
      await createNotification({
        recipientId: updated.writerId,
        type: "SCRIPT_APPROVED",
        title: "Script Approved!",
        message: `Script #${updated.videoNumber} for ${updated.client.companyName} was approved.`,
        entityType: "SCRIPT",
        entityId: updated.id,
      });
    }

    return NextResponse.json({ success: true, script: updated });
  } catch (error: any) {
    console.error("PATCH /api/scripts/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update script" },
      { status: error.statusCode || 500 }
    );
  }
}

// Add comment to script
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const script = await prisma.script.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (!canAccessClient(session, script.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { commentText } = body;
    if (!commentText || !commentText.trim()) {
      return NextResponse.json({ error: "Comment text cannot be empty" }, { status: 400 });
    }

    const comment = await prisma.scriptComment.create({
      data: {
        scriptId: id,
        authorId: session.id,
        authorRole: session.role === "EMPLOYEE" ? session.employeeRole || "EMPLOYEE" : session.role,
        commentText: commentText.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/scripts/[id] comment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post comment" },
      { status: error.statusCode || 500 }
    );
  }
}
