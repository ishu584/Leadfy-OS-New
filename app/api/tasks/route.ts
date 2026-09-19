import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { z } from "zod";
import { logActivity } from "@/lib/audit";

const CreateTaskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  deadline: z.string().or(z.date()).optional().nullable(),
  status: z.enum(["TO_DO", "IN_PROGRESS", "DONE"]).default("TO_DO"),
  attachments: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "tasks:read");

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToMe) where.assigneeId = session.id;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ priority: "asc" }, { deadline: "asc" }],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "tasks:write");

    const body = await req.json();
    const parsed = CreateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status,
        attachments: data.attachments,
      },
      include: {
        assignee: true,
      },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      metadata: { title: task.title, priority: task.priority },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: error.statusCode || 500 }
    );
  }
}
