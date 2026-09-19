import { z } from "zod";

export const ScriptStatusEnum = z.enum([
  "DRAFT",
  "ASSIGNED",
  "IN_REVIEW",
  "SENT_TO_CLIENT",
  "REVISION_REQUIRED",
  "APPROVED",
  "READY_FOR_SHOOT",
]);

export const CreateScriptSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  orderId: z.string().min(1, "Order is required"),
  videoNumber: z.number().int().positive("Video number must be positive"),
  writerId: z.string().optional().nullable(),
  creatorId: z.string().optional().nullable(),
  language: z.string().default("English"),
  scriptText: z.string().min(10, "Script text must have content"),
  referenceLinks: z.string().optional().nullable(),
  deadline: z.string().or(z.date()).optional().nullable(),
  status: ScriptStatusEnum.default("DRAFT"),
});

export const UpdateScriptSchema = z.object({
  writerId: z.string().optional().nullable(),
  creatorId: z.string().optional().nullable(),
  language: z.string().optional(),
  scriptText: z.string().min(10).optional(),
  referenceLinks: z.string().optional().nullable(),
  deadline: z.string().or(z.date()).optional().nullable(),
  status: ScriptStatusEnum.optional(),
});

export const ScriptCommentSchema = z.object({
  scriptId: z.string().min(1),
  commentText: z.string().min(1, "Comment cannot be empty"),
});

// Strict state transitions
export const VALID_SCRIPT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ASSIGNED", "IN_REVIEW"],
  ASSIGNED: ["IN_REVIEW", "DRAFT"],
  IN_REVIEW: ["SENT_TO_CLIENT", "DRAFT"],
  SENT_TO_CLIENT: ["REVISION_REQUIRED", "APPROVED"],
  REVISION_REQUIRED: ["IN_REVIEW", "SENT_TO_CLIENT", "DRAFT"],
  APPROVED: ["READY_FOR_SHOOT"],
  READY_FOR_SHOOT: [],
};

export function isValidScriptTransition(current: string, next: string): boolean {
  if (current === next) return true;
  // Special business rule: READY_FOR_SHOOT requires current status to be APPROVED
  if (next === "READY_FOR_SHOOT" && current !== "APPROVED") {
    return false;
  }
  const allowed = VALID_SCRIPT_TRANSITIONS[current] || [];
  return allowed.includes(next);
}
