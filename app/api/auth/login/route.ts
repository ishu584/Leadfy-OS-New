import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/crypto";
import { setSessionCookie } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        clientProfile: true,
      },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      employeeRole: user.employeeRole as any,
      clientId: user.clientProfile?.id || null,
      avatar: user.avatar,
    };

    await setSessionCookie(sessionUser);

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      action: "USER_LOGIN",
      entityType: "USER",
      entityId: user.id,
      metadata: { role: user.role },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
