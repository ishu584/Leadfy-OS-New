import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: session.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { recipientId: session.id, isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: error.statusCode || 500 }
    );
  }
}

// Mark all as read
export async function PATCH(_req: NextRequest) {
  try {
    const session = await requireAuth();

    await prisma.notification.updateMany({
      where: { recipientId: session.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notifications" },
      { status: error.statusCode || 500 }
    );
  }
}
