import { prisma } from "./prisma";

export interface LogAuditParams {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Creates an immutable audit log entry.
 */
export async function logActivity(params: LogAuditParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        actorId: params.actorId,
        actorName: params.actorName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export interface CreateNotificationParams {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Creates an in-app notification with deduplication.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // Deduplication check within the last 10 minutes for identical type + entityId
    if (params.entityId) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const existing = await prisma.notification.findFirst({
        where: {
          recipientId: params.recipientId,
          type: params.type,
          entityId: params.entityId,
          createdAt: { gte: tenMinutesAgo },
        },
      });
      if (existing) return existing;
    }

    return await prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
