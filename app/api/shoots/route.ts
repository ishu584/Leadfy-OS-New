import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { CreateShootSchema } from "@/schemas/shoot";
import { logActivity, createNotification } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role === "CLIENT") {
      assertPermission(session, "portal:access");
    } else {
      assertPermission(session, "shoots:read");
    }

    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const creatorId = searchParams.get("creatorId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (session.role === "CLIENT") {
      where.clientId = session.clientId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (creatorId) where.creatorId = creatorId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.shootDate = {};
      if (startDate) where.shootDate.gte = new Date(startDate);
      if (endDate) where.shootDate.lte = new Date(endDate);
    }

    const shoots = await prisma.shoot.findMany({
      where,
      orderBy: { shootDate: "asc" },
      include: {
        client: { select: { id: true, name: true, companyName: true, brandName: true } },
        order: { select: { id: true, packageName: true } },
        creator: { select: { id: true, name: true, photo: true, phone: true } },
        shootManager: { select: { id: true, name: true } },
        cameraman: { select: { id: true, name: true } },
        videos: { select: { id: true, status: true } },
      },
    });

    return NextResponse.json({ shoots });
  } catch (error: any) {
    console.error("GET /api/shoots error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shoots" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "shoots:write");

    const body = await req.json();
    const parsed = CreateShootSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const requestedDate = new Date(data.shootDate);

    // Strict Double-Booking Guard: Check for overlapping confirmed shoots for the same creator on the same day
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const conflictingShoot = await prisma.shoot.findFirst({
      where: {
        creatorId: data.creatorId,
        status: { in: ["CONFIRMED", "SCHEDULED", "IN_PROGRESS"] },
        shootDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        creator: { select: { name: true } },
      },
    });

    if (conflictingShoot) {
      return NextResponse.json(
        {
          error: `Scheduling Conflict: Creator ${conflictingShoot.creator.name} is already booked on ${dayStart.toISOString().slice(0, 10)}. Double booking is prevented.`,
        },
        { status: 409 }
      );
    }

    const shoot = await prisma.shoot.create({
      data: {
        clientId: data.clientId,
        orderId: data.orderId,
        creatorId: data.creatorId,
        shootManagerId: data.shootManagerId || (session.role === "EMPLOYEE" && session.employeeRole === "SHOOT_MANAGER" ? session.id : null),
        cameramanId: data.cameramanId,
        shootingAssistantId: data.shootingAssistantId,
        shootDate: requestedDate,
        shootTime: data.shootTime,
        location: data.location,
        approvedScriptIds: JSON.stringify(data.approvedScriptIds || []),
        specialNotes: data.specialNotes,
        status: data.status,
        preShootChecklist: JSON.stringify(
          data.preShootChecklist || {
            scriptApproval: false,
            creatorConfirmation: false,
            locationPermissions: false,
            clientProductReceipt: false,
            teamBriefing: false,
          }
        ),
      },
      include: {
        client: true,
        creator: true,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "SHOOT_SCHEDULED",
      entityType: "SHOOT",
      entityId: shoot.id,
      metadata: {
        date: requestedDate.toISOString().slice(0, 10),
        creator: shoot.creator.name,
        location: shoot.location,
      },
    });

    // Notify shoot manager or team
    if (shoot.shootManagerId) {
      await createNotification({
        recipientId: shoot.shootManagerId,
        type: "SHOOT_SCHEDULED",
        title: "Upcoming Shoot Scheduled",
        message: `Shoot scheduled with ${shoot.creator.name} on ${shoot.shootTime} at ${shoot.location}.`,
        entityType: "SHOOT",
        entityId: shoot.id,
      });
    }

    return NextResponse.json({ success: true, shoot }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/shoots error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule shoot" },
      { status: error.statusCode || 500 }
    );
  }
}
