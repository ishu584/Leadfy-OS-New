import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await logActivity({
        actorId: session.id,
        actorName: session.name,
        action: "USER_LOGOUT",
        entityType: "USER",
        entityId: session.id,
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
