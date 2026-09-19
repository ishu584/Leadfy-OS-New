import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission, hasPermission } from "@/lib/rbac";
import { hashPassword } from "@/lib/crypto";
import { z } from "zod";
import { logActivity } from "@/lib/audit";

const CreateEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).default("Password123!"),
  roleType: z.enum(["SALES", "SCRIPT_WRITER", "SHOOT_MANAGER", "EDITOR"]),
  salary: z.number().positive(),
  department: z.string().min(2),
  employeeCode: z.string().min(2),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "employees:read");

    const canViewSalaries = hasPermission(session, "employees:salaries");

    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            employeeRole: true,
            active: true,
            avatar: true,
            _count: {
              select: {
                assignedClients: true,
                writtenScripts: true,
                managedShoots: true,
                assignedVideos: true,
                assignedTasks: true,
              },
            },
          },
        },
      },
    });

    // Strip sensitive salary if not authorized
    const safeEmployees = employees.map((emp) => ({
      id: emp.id,
      userId: emp.userId,
      employeeCode: emp.employeeCode,
      roleType: emp.roleType,
      department: emp.department,
      joiningDate: emp.joiningDate,
      salary: canViewSalaries ? emp.salary : undefined,
      user: emp.user,
    }));

    return NextResponse.json({ employees: safeEmployees });
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employees" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "employees:write");

    const body = await req.json();
    const parsed = CreateEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check unique email & code
    const existingUser = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const existingCode = await prisma.employee.findUnique({ where: { employeeCode: data.employeeCode } });
    if (existingCode) {
      return NextResponse.json({ error: "Employee code already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: "EMPLOYEE",
          employeeRole: data.roleType,
          active: true,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode: data.employeeCode,
          roleType: data.roleType,
          salary: data.salary,
          department: data.department,
          joiningDate: new Date(),
        },
        include: { user: true },
      });

      return employee;
    });

    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "EMPLOYEE_CREATED",
      entityType: "EMPLOYEE",
      entityId: result.id,
      metadata: { code: result.employeeCode, role: result.roleType },
    });

    return NextResponse.json({ success: true, employee: result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create employee" },
      { status: error.statusCode || 500 }
    );
  }
}
