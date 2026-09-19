import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission, canAccessClient } from "@/lib/rbac";
import { UpdateShootSchema } from "@/schemas/shoot";
import { logActivity } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const shoot = await prisma.shoot.findUnique({
      where: { id },
      include: {
        client: true,
        order: true,
        creator: true,
        shootManager: { select: { id: true, name: true, email: true } },
        cameraman: { select: { id: true, name: true, email: true } },
        videos: true,
      },
    });

    if (!shoot) {
      return NextResponse.json({ error: "Shoot not found" }, { status: 404 });
    }

    if (!canAccessClient(session, shoot.clientId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      shoot: {
        ...shoot,
        preShootChecklist: JSON.parse(shoot.preShootChecklist || "{}"),
        postShootVerification: JSON.parse(shoot.postShootVerification || "{}"),
        approvedScriptIds: JSON.parse(shoot.approvedScriptIds || "[]"),
      },
    });
  } catch (error: any) {
    console.error("GET /api/shoots/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shoot" },
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
    assertPermission(session, "shoots:write");
    const { id } = await context.params;

    const current = await prisma.shoot.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Shoot not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = UpdateShootSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updatePayload: any = {};
    if (data.creatorId !== undefined) updatePayload.creatorId = data.creatorId;
    if (data.shootManagerId !== undefined) updatePayload.shootManagerId = data.shootManagerId;
    if (data.cameramanId !== undefined) updatePayload.cameramanId = data.cameramanId;
    if (data.shootingAssistantId !== undefined) updatePayload.shootingAssistantId = data.shootingAssistantId;
    if (data.shootDate !== undefined) updatePayload.shootDate = new Date(data.shootDate);
    if (data.shootTime !== undefined) updatePayload.shootTime = data.shootTime;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.specialNotes !== undefined) updatePayload.specialNotes = data.specialNotes;
    if (data.status !== undefined) updatePayload.status = data.status;

    if (data.approvedScriptIds !== undefined) {
      updatePayload.approvedScriptIds = JSON.stringify(data.approvedScriptIds);
    }

    if (data.preShootChecklist !== undefined) {
      const existing = JSON.parse(current.preShootChecklist || "{}");
      updatePayload.preShootChecklist = JSON.stringify({ ...existing, ...data.preShootChecklist });
    }

    if (data.postShootVerification !== undefined) {
      const existing = JSON.parse(current.postShootVerification || "{}");
      updatePayload.postShootVerification = JSON.stringify({ ...existing, ...data.postShootVerification });
    }

    const updated = await prisma.shoot.update({
      where: { id },
      data: updatePayload,
      include: { client: true, creator: true },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: data.status ? `SHOOT_STATUS_${data.status}` : "SHOOT_UPDATED",
      entityType: "SHOOT",
      entityId: id,
      metadata: updatePayload,
    });

    return NextResponse.json({
      success: true,
      shoot: {
        ...updated,
        preShootChecklist: JSON.parse(updated.preShootChecklist || "{}"),
        postShootVerification: JSON.parse(updated.postShootVerification || "{}"),
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/shoots/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update shoot" },
      { status: error.statusCode || 500 }
    );
  }
}
