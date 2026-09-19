import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { CreateCreatorSchema } from "@/schemas/creator";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "creators:read");

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const niche = searchParams.get("niche") || "";
    const availability = searchParams.get("availability") || "";

    const where: any = {};
    if (availability) {
      where.availabilityStatus = availability;
    }
    if (niche) {
      where.niches = { contains: niche };
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
        { languages: { contains: search } },
        { niches: { contains: search } },
      ];
    }

    const creators = await prisma.creator.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            shoots: true,
            videos: true,
            payouts: true,
          },
        },
        shoots: {
          where: {
            status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
          },
          select: {
            id: true,
            shootDate: true,
            shootTime: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ creators });
  } catch (error: any) {
    console.error("GET /api/creators error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch creators" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "creators:write");

    const body = await req.json();
    const parsed = CreateCreatorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const creator = await prisma.creator.create({
      data: {
        name: data.name,
        photo: data.photo,
        gender: data.gender,
        ageGroup: data.ageGroup,
        languages: data.languages,
        location: data.location,
        niches: data.niches,
        demographics: data.demographics,
        phone: data.phone,
        email: data.email,
        rates: data.rates,
        bankDetails: data.bankDetails,
        portfolioLinks: data.portfolioLinks,
        availabilityStatus: data.availabilityStatus,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "CREATOR_CREATED",
      entityType: "CREATOR",
      entityId: creator.id,
      metadata: { name: creator.name, rates: creator.rates },
    });

    return NextResponse.json({ success: true, creator }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/creators error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create creator" },
      { status: error.statusCode || 500 }
    );
  }
}
