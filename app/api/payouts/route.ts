import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { CreateCreatorPayoutSchema } from "@/schemas/finance";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "payouts:read");

    const searchParams = req.nextUrl.searchParams;
    const creatorId = searchParams.get("creatorId");
    const status = searchParams.get("status");

    const where: any = {};
    if (creatorId) where.creatorId = creatorId;
    if (status) where.status = status;

    const payouts = await prisma.creatorPayout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, phone: true, bankDetails: true } },
        order: { select: { id: true, packageName: true, client: { select: { companyName: true } } } },
        video: { select: { id: true, status: true, finalDeliveryUrl: true } },
      },
    });

    return NextResponse.json({ payouts });
  } catch (error: any) {
    console.error("GET /api/payouts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payouts" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "payouts:write");

    const body = await req.json();
    const parsed = CreateCreatorPayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Strict Business Logic Guard: Check if a payout already exists for this video
    const existingPayout = await prisma.creatorPayout.findUnique({
      where: { videoId: data.videoId },
    });

    if (existingPayout) {
      return NextResponse.json(
        {
          error: `Duplicate Payout Blocked: A payout (ID: ${existingPayout.id}, Status: ${existingPayout.status}) already exists for this video. Cannot generate duplicate creator payout.`,
        },
        { status: 409 }
      );
    }

    const totalPayout = data.videoCount * data.contractedRate;

    const payout = await prisma.creatorPayout.create({
      data: {
        creatorId: data.creatorId,
        orderId: data.orderId,
        videoId: data.videoId,
        videoCount: data.videoCount,
        contractedRate: data.contractedRate,
        totalPayout,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        transactionRef: data.transactionRef,
        status: data.status,
      },
      include: {
        creator: true,
        video: true,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "CREATOR_PAYOUT_CREATED",
      entityType: "CREATOR_PAYOUT",
      entityId: payout.id,
      metadata: {
        creatorName: payout.creator.name,
        totalPayout,
        status: payout.status,
      },
    });

    return NextResponse.json({ success: true, payout }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payouts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payout" },
      { status: error.statusCode || 500 }
    );
  }
}
