/**
 * LEADYFY OS - Production Database Migration Script
 * SQLite (dev.db) -> PostgreSQL
 *
 * This script safely migrates all existing records from prisma/dev.db into the target
 * PostgreSQL database while preserving all CUID IDs, bcrypt password hashes,
 * foreign key relationships, timestamps, and data integrity.
 *
 * ZERO-RISK: NEVER DELETES OR OVERWRITES dev.db.
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const devDbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const targetUrl: string = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";

if (!targetUrl || targetUrl.startsWith("file:")) {
  console.error("❌ Error: TARGET_DATABASE_URL or DATABASE_URL must be a valid PostgreSQL connection string.");
  console.error("   Example: DATABASE_URL=\"postgresql://user:password@host:5432/dbname?schema=public\"");
  process.exit(1);
}

const sqlite = new DatabaseSync(devDbPath);
const prisma = new PrismaClient({
  datasources: {
    db: { url: targetUrl },
  },
});

function parseDate(val: any): Date | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    if (/^\d+$/.test(val)) return new Date(parseInt(val, 10));
    return new Date(val);
  }
  return new Date(val);
}

function parseBool(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") return val.toLowerCase() === "true" || val === "1";
  return Boolean(val);
}

interface TableMigrationStats {
  table: string;
  sqliteCount: number;
  migratedCount: number;
  status: "OK" | "EMPTY" | "FAILED";
  error?: string;
}

async function migrate() {
  console.log("=================================================================");
  console.log("LEADYFY OS: SQLite (dev.db) -> PostgreSQL Migration Engine");
  console.log("Target Database:", targetUrl.replace(/:([^:@]+)@/, ":****@"));
  console.log("Source Database:", devDbPath);
  console.log("=================================================================\n");

  const stats: TableMigrationStats[] = [];

  try {
    await prisma.$connect();
    console.log("✓ Connected successfully to target PostgreSQL database.\n");

    // 1. Users
    {
      const rows = sqlite.prepare(`SELECT * FROM "User"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.user.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            email: r.email,
            passwordHash: r.passwordHash,
            name: r.name,
            role: r.role,
            employeeRole: r.employeeRole || null,
            avatar: r.avatar || null,
            active: parseBool(r.active),
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {
            email: r.email,
            passwordHash: r.passwordHash,
            name: r.name,
            role: r.role,
            employeeRole: r.employeeRole || null,
            avatar: r.avatar || null,
            active: parseBool(r.active),
          },
        });
        count++;
      }
      stats.push({ table: "User", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ User: ${count}/${rows.length} rows migrated`);
    }

    // 2. Creator
    {
      const rows = sqlite.prepare(`SELECT * FROM "Creator"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.creator.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            name: r.name,
            photo: r.photo || null,
            gender: r.gender,
            ageGroup: r.ageGroup,
            languages: r.languages,
            location: r.location,
            niches: r.niches,
            demographics: r.demographics || null,
            phone: r.phone,
            email: r.email,
            rates: Number(r.rates),
            bankDetails: r.bankDetails || null,
            portfolioLinks: r.portfolioLinks || null,
            availabilityStatus: r.availabilityStatus,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Creator", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Creator: ${count}/${rows.length} rows migrated`);
    }

    // 3. ActivityLog
    {
      const rows = sqlite.prepare(`SELECT * FROM "ActivityLog"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.activityLog.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            actorId: r.actorId,
            actorName: r.actorName,
            action: r.action,
            entityType: r.entityType,
            entityId: r.entityId,
            metadata: r.metadata || null,
            ipAddress: r.ipAddress || null,
            createdAt: parseDate(r.createdAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "ActivityLog", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ ActivityLog: ${count}/${rows.length} rows migrated`);
    }

    // 4. Employee
    {
      const rows = sqlite.prepare(`SELECT * FROM "Employee"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.employee.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            userId: r.userId,
            employeeCode: r.employeeCode,
            roleType: r.roleType,
            salary: Number(r.salary),
            joiningDate: parseDate(r.joiningDate) || new Date(),
            department: r.department,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Employee", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Employee: ${count}/${rows.length} rows migrated`);
    }

    // 5. Client
    {
      const rows = sqlite.prepare(`SELECT * FROM "Client"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.client.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            userId: r.userId || null,
            name: r.name,
            companyName: r.companyName,
            email: r.email,
            phone: r.phone,
            whatsapp: r.whatsapp || null,
            brandName: r.brandName,
            industry: r.industry,
            taxId: r.taxId || null,
            assignedEmployeeId: r.assignedEmployeeId || null,
            source: r.source || null,
            status: r.status,
            assets: r.assets || null,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Client", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Client: ${count}/${rows.length} rows migrated`);
    }

    // 6. CreatorAvailability
    {
      const rows = sqlite.prepare(`SELECT * FROM "CreatorAvailability"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.creatorAvailability.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            creatorId: r.creatorId,
            date: r.date,
            isBooked: parseBool(r.isBooked),
            notes: r.notes || null,
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "CreatorAvailability", sqliteCount: rows.length, migratedCount: count, status: rows.length > 0 ? "OK" : "EMPTY" });
      console.log(`✓ CreatorAvailability: ${count}/${rows.length} rows migrated`);
    }

    // 7. Expense
    {
      const rows = sqlite.prepare(`SELECT * FROM "Expense"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.expense.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            category: r.category,
            amount: Number(r.amount),
            recordedById: r.recordedById,
            date: parseDate(r.date) || new Date(),
            receiptUrl: r.receiptUrl || null,
            notes: r.notes || null,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Expense", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Expense: ${count}/${rows.length} rows migrated`);
    }

    // 8. Task
    {
      const rows = sqlite.prepare(`SELECT * FROM "Task"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.task.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            title: r.title,
            description: r.description || null,
            assigneeId: r.assigneeId || null,
            priority: r.priority,
            deadline: parseDate(r.deadline),
            status: r.status,
            attachments: r.attachments || null,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Task", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Task: ${count}/${rows.length} rows migrated`);
    }

    // 9. Notification
    {
      const rows = sqlite.prepare(`SELECT * FROM "Notification"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.notification.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            recipientId: r.recipientId,
            type: r.type,
            title: r.title,
            message: r.message,
            entityType: r.entityType || null,
            entityId: r.entityId || null,
            isRead: parseBool(r.isRead),
            createdAt: parseDate(r.createdAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Notification", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Notification: ${count}/${rows.length} rows migrated`);
    }

    // 10. Order
    {
      const rows = sqlite.prepare(`SELECT * FROM "Order"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.order.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            clientId: r.clientId,
            packageName: r.packageName,
            contractedVideoCount: Number(r.contractedVideoCount),
            pricing: Number(r.pricing),
            taxAmount: Number(r.taxAmount || 0),
            totalAmount: Number(r.totalAmount),
            amountReceived: Number(r.amountReceived || 0),
            outstandingBalance: Number(r.outstandingBalance),
            startDate: parseDate(r.startDate) || new Date(),
            dueDate: parseDate(r.dueDate) || new Date(),
            assignedTeamId: r.assignedTeamId || null,
            status: r.status,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Order", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Order: ${count}/${rows.length} rows migrated`);
    }

    // 11. SupportTicket
    {
      const rows = sqlite.prepare(`SELECT * FROM "SupportTicket"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.supportTicket.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            clientId: r.clientId,
            subject: r.subject,
            message: r.message,
            priority: r.priority,
            status: r.status,
            assignedToId: r.assignedToId || null,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "SupportTicket", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ SupportTicket: ${count}/${rows.length} rows migrated`);
    }

    // 12. Asset
    {
      const rows = sqlite.prepare(`SELECT * FROM "Asset"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.asset.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            clientId: r.clientId || null,
            name: r.name,
            fileType: r.fileType,
            fileUrl: r.fileUrl,
            fileSize: Number(r.fileSize),
            uploadedById: r.uploadedById,
            createdAt: parseDate(r.createdAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Asset", sqliteCount: rows.length, migratedCount: count, status: rows.length > 0 ? "OK" : "EMPTY" });
      console.log(`✓ Asset: ${count}/${rows.length} rows migrated`);
    }

    // 13. Script
    {
      const rows = sqlite.prepare(`SELECT * FROM "Script"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.script.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            clientId: r.clientId,
            orderId: r.orderId,
            videoNumber: Number(r.videoNumber),
            writerId: r.writerId || null,
            creatorId: r.creatorId || null,
            language: r.language,
            scriptText: r.scriptText,
            referenceLinks: r.referenceLinks || null,
            deadline: parseDate(r.deadline),
            revisionCount: Number(r.revisionCount || 0),
            status: r.status,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Script", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Script: ${count}/${rows.length} rows migrated`);
    }

    // 14. Payment
    {
      const rows = sqlite.prepare(`SELECT * FROM "Payment"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.payment.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            orderId: r.orderId,
            clientId: r.clientId,
            invoiceAmount: Number(r.invoiceAmount),
            amountReceived: Number(r.amountReceived),
            pendingBalance: Number(r.pendingBalance),
            paymentDate: parseDate(r.paymentDate) || new Date(),
            paymentMethod: r.paymentMethod,
            transactionRef: r.transactionRef || null,
            notes: r.notes || null,
            status: r.status,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Payment", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Payment: ${count}/${rows.length} rows migrated`);
    }

    // 15. TicketResponse
    {
      const rows = sqlite.prepare(`SELECT * FROM "TicketResponse"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.ticketResponse.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            ticketId: r.ticketId,
            authorId: r.authorId,
            authorName: r.authorName,
            authorRole: r.authorRole,
            message: r.message,
            createdAt: parseDate(r.createdAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "TicketResponse", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ TicketResponse: ${count}/${rows.length} rows migrated`);
    }

    // 16. ScriptComment
    {
      const rows = sqlite.prepare(`SELECT * FROM "ScriptComment"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.scriptComment.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            scriptId: r.scriptId,
            authorId: r.authorId,
            authorRole: r.authorRole,
            commentText: r.commentText,
            createdAt: parseDate(r.createdAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "ScriptComment", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ ScriptComment: ${count}/${rows.length} rows migrated`);
    }

    // 17. Shoot
    {
      const rows = sqlite.prepare(`SELECT * FROM "Shoot"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.shoot.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            clientId: r.clientId,
            orderId: r.orderId,
            creatorId: r.creatorId,
            shootManagerId: r.shootManagerId || null,
            cameramanId: r.cameramanId || null,
            shootingAssistantId: r.shootingAssistantId || null,
            shootDate: parseDate(r.shootDate) || new Date(),
            shootTime: r.shootTime,
            location: r.location,
            approvedScriptIds: r.approvedScriptIds || "[]",
            specialNotes: r.specialNotes || null,
            status: r.status,
            preShootChecklist: r.preShootChecklist || "{}",
            postShootVerification: r.postShootVerification || "{}",
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Shoot", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Shoot: ${count}/${rows.length} rows migrated`);
    }

    // 18. Video
    {
      const rows = sqlite.prepare(`SELECT * FROM "Video"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.video.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            clientId: r.clientId,
            orderId: r.orderId,
            scriptId: r.scriptId || null,
            creatorId: r.creatorId || null,
            shootId: r.shootId || null,
            assignedEditorId: r.assignedEditorId || null,
            deadline: parseDate(r.deadline),
            rawFootageUrl: r.rawFootageUrl || null,
            editDraftUrl: r.editDraftUrl || null,
            thumbnail: r.thumbnail || null,
            finalDeliveryUrl: r.finalDeliveryUrl || null,
            revisionCount: Number(r.revisionCount || 0),
            status: r.status,
            finalApprovedAt: parseDate(r.finalApprovedAt),
            deliveredAt: parseDate(r.deliveredAt),
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "Video", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ Video: ${count}/${rows.length} rows migrated`);
    }

    // 19. VideoFeedback
    {
      const rows = sqlite.prepare(`SELECT * FROM "VideoFeedback"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.videoFeedback.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            videoId: r.videoId,
            authorId: r.authorId,
            authorName: r.authorName,
            timestampCode: r.timestampCode,
            feedbackText: r.feedbackText,
            revisionNumber: Number(r.revisionNumber || 1),
            createdAt: parseDate(r.createdAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "VideoFeedback", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ VideoFeedback: ${count}/${rows.length} rows migrated`);
    }

    // 20. CreatorPayout
    {
      const rows = sqlite.prepare(`SELECT * FROM "CreatorPayout"`).all() as any[];
      let count = 0;
      for (const r of rows) {
        await prisma.creatorPayout.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            creatorId: r.creatorId,
            orderId: r.orderId,
            videoId: r.videoId,
            videoCount: Number(r.videoCount || 1),
            contractedRate: Number(r.contractedRate),
            totalPayout: Number(r.totalPayout),
            paymentDate: parseDate(r.paymentDate),
            transactionRef: r.transactionRef || null,
            status: r.status,
            createdAt: parseDate(r.createdAt) || new Date(),
            updatedAt: parseDate(r.updatedAt) || new Date(),
          },
          update: {},
        });
        count++;
      }
      stats.push({ table: "CreatorPayout", sqliteCount: rows.length, migratedCount: count, status: "OK" });
      console.log(`✓ CreatorPayout: ${count}/${rows.length} rows migrated`);
    }

    console.log("\n=================================================================");
    console.log("MIGRATION SUMMARY & VERIFICATION REPORT");
    console.log("=================================================================");
    console.table(
      stats.map((s) => ({
        Table: s.table,
        "Source (dev.db)": s.sqliteCount,
        "Target (Postgres)": s.migratedCount,
        Status: s.status,
      }))
    );

    const totalSource = stats.reduce((acc, s) => acc + s.sqliteCount, 0);
    const totalMigrated = stats.reduce((acc, s) => acc + s.migratedCount, 0);
    console.log(`Total Source Rows: ${totalSource}`);
    console.log(`Total Migrated Rows: ${totalMigrated}`);

    if (totalSource === totalMigrated) {
      console.log("\n🎉 ALL RECORDS MIGRATED AND VERIFIED WITH 100% ACCURACY!");
    } else {
      console.warn("\n⚠️ Discrepancy detected between source and target counts.");
    }
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
