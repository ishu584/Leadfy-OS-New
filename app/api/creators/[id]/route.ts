import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { UpdateCreatorSchema } from "@/schemas/creator";
import { logActivity } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    assertPermission(session, "creators:read");
    const { id } = await context.params;

    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        shoots: {
          orderBy: { shootDate: "desc" },
          include: { client: { select: { id: true, companyName: true } } },
        },
        videos: {
          orderBy: { createdAt: "desc" },
        },
        payouts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({ creator });
  } catch (error: any) {
    console.error("GET /api/creators/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch creator" },
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
    assertPermission(session, "creators:write");
    const { id } = await context.params;

    const body = await req.json();
    const parsed = UpdateCreatorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.creator.update({
      where: { id },
      data,
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "CREATOR_UPDATED",
      entityType: "CREATOR",
      entityId: id,
      metadata: data,
    });

    return NextResponse.json({ success: true, creator: updated });
  } catch (error: any) {
    console.error("PATCH /api/creators/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update creator" },
      { status: error.statusCode || 500 }
    );
  }
}
