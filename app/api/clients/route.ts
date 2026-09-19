import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { CreateClientSchema } from "@/schemas/client";
import { logActivity, createNotification } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "clients:read");

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
        { brandName: { contains: search } },
      ];
    }

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedEmployee: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { orders: true, scripts: true, videos: true },
          },
        },
      }),
    ]);

    // Format with canonical companyName and convenience company alias
    const formattedClients = clients.map((c) => ({
      ...c,
      company: c.companyName, // Canonical alias guarantee
    }));

    return NextResponse.json({
      clients: formattedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch clients" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    assertPermission(session, "clients:write");

    const body = await req.json();
    const parsed = CreateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check email uniqueness
    const existing = await prisma.client.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A client with this email already exists" },
        { status: 409 }
      );
    }

    const newClient = await prisma.client.create({
      data: {
        name: data.name,
        companyName: data.companyName, // CANONICAL FIELD
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        brandName: data.brandName,
        industry: data.industry,
        taxId: data.taxId,
        assignedEmployeeId: data.assignedEmployeeId,
        source: data.source,
        status: data.status,
        assets: data.assets,
      },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Immutable audit log
    await logActivity({
      actorId: session.id,
      actorName: session.name,
      action: "CLIENT_CREATED",
      entityType: "CLIENT",
      entityId: newClient.id,
      metadata: { companyName: newClient.companyName, status: newClient.status },
    });

    // Notify assigned employee if applicable
    if (newClient.assignedEmployeeId) {
      await createNotification({
        recipientId: newClient.assignedEmployeeId,
        type: "NEW_CLIENT_ONBOARDING",
        title: "New Client Assigned",
        message: `You have been assigned as lead manager for ${newClient.companyName}.`,
        entityType: "CLIENT",
        entityId: newClient.id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        client: {
          ...newClient,
          company: newClient.companyName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create client" },
      { status: error.statusCode || 500 }
    );
  }
}
