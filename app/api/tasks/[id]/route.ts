import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { z } from "zod";
import { logActivity } from "@/lib/audit";

const UpdateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  deadline: z.string().or(z.date()).optional().nullable(),
  status: z.enum(["TO_DO", "IN_PROGRESS", "DONE"]).optional(),
  attachments: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    assertPermission(session, "tasks:write");
    const { id } = await context.params;

    const body = await req.json();
    const parsed = UpdateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status: data.status,
        attachments: data.attachments,
      },
      include: { assignee: true },
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "TASK_UPDATED",
      entityType: "TASK",
      entityId: id,
      metadata: data,
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: error.statusCode || 500 }
    );
  }
}
