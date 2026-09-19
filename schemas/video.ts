import { z } from "zod";

export const VideoStatusEnum = z.enum([
  "SCRIPT_APPROVED",
  "SHOOT_PENDING",
  "RAW_FOOTAGE_RECEIVED",
  "VIDEO_EDITING",
  "INTERNAL_QA",
  "CLIENT_REVIEW",
  "REVISION",
  "FINAL_APPROVED",
  "DELIVERED",
]);

export const CreateVideoSchema = z.object({
  clientId: z.string().min(1),
  orderId: z.string().min(1),
  scriptId: z.string().optional().nullable(),
  creatorId: z.string().optional().nullable(),
  shootId: z.string().optional().nullable(),
  assignedEditorId: z.string().optional().nullable(),
  deadline: z.string().or(z.date()).optional().nullable(),
  status: VideoStatusEnum.default("SCRIPT_APPROVED"),
});

export const UpdateVideoSchema = z.object({
  assignedEditorId: z.string().optional().nullable(),
  deadline: z.string().or(z.date()).optional().nullable(),
  rawFootageUrl: z.string().optional().nullable(),
  editDraftUrl: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  finalDeliveryUrl: z.string().optional().nullable(),
  status: VideoStatusEnum.optional(),
});

export const ClientVideoFeedbackSchema = z.object({
  videoId: z.string().min(1),
  timestampCode: z.string().min(1, "Timestamp code required (e.g. 00:42)"),
  feedbackText: z.string().min(3, "Feedback text is required"),
  action: z.enum(["REVISION_REQUESTED", "COMMENT_ONLY"]),
});

export const VALID_VIDEO_TRANSITIONS: Record<string, string[]> = {
  SCRIPT_APPROVED: ["SHOOT_PENDING", "RAW_FOOTAGE_RECEIVED"],
  SHOOT_PENDING: ["RAW_FOOTAGE_RECEIVED"],
  RAW_FOOTAGE_RECEIVED: ["VIDEO_EDITING"],
  VIDEO_EDITING: ["INTERNAL_QA"],
  INTERNAL_QA: ["CLIENT_REVIEW", "VIDEO_EDITING"],
  CLIENT_REVIEW: ["REVISION", "FINAL_APPROVED"],
  REVISION: ["VIDEO_EDITING", "INTERNAL_QA"],
  FINAL_APPROVED: ["DELIVERED"],
  DELIVERED: [],
};

export function isValidVideoTransition(current: string, next: string): boolean {
  if (current === next) return true;
  // Crucial business rule: DELIVERED requires current to be FINAL_APPROVED
  if (next === "DELIVERED" && current !== "FINAL_APPROVED") {
    return false;
  }
  const allowed = VALID_VIDEO_TRANSITIONS[current] || [];
  return allowed.includes(next);
}
