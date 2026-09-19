import { z } from "zod";

export const ShootStatusEnum = z.enum([
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESHOOT_REQUIRED",
]);

export const PreShootChecklistSchema = z.object({
  scriptApproval: z.boolean().default(false),
  creatorConfirmation: z.boolean().default(false),
  locationPermissions: z.boolean().default(false),
  clientProductReceipt: z.boolean().default(false),
  teamBriefing: z.boolean().default(false),
});

export const PostShootVerificationSchema = z.object({
  footageUploaded: z.boolean().default(false),
  rawFileIntegrity: z.boolean().default(false),
  reshootFlag: z.boolean().default(false),
});

export const CreateShootSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  orderId: z.string().min(1, "Order is required"),
  creatorId: z.string().min(1, "Creator is required"),
  shootManagerId: z.string().optional().nullable(),
  cameramanId: z.string().optional().nullable(),
  shootingAssistantId: z.string().optional().nullable(),
  shootDate: z.string().or(z.date()),
  shootTime: z.string().min(1, "Shoot time is required (e.g. 10:00 AM)"),
  location: z.string().min(2, "Location is required"),
  approvedScriptIds: z.array(z.string()).default([]),
  specialNotes: z.string().optional().nullable(),
  status: ShootStatusEnum.default("SCHEDULED"),
  preShootChecklist: PreShootChecklistSchema.optional(),
});

export const UpdateShootSchema = z.object({
  creatorId: z.string().optional(),
  shootManagerId: z.string().optional().nullable(),
  cameramanId: z.string().optional().nullable(),
  shootingAssistantId: z.string().optional().nullable(),
  shootDate: z.string().or(z.date()).optional(),
  shootTime: z.string().optional(),
  location: z.string().optional(),
  approvedScriptIds: z.array(z.string()).optional(),
  specialNotes: z.string().optional().nullable(),
  status: ShootStatusEnum.optional(),
  preShootChecklist: PreShootChecklistSchema.optional(),
  postShootVerification: PostShootVerificationSchema.optional(),
});
