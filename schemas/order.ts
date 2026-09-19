import { z } from "zod";

export const OrderStatusEnum = z.enum([
  "NEW",
  "ONBOARDING",
  "IN_PRODUCTION",
  "PARTIALLY_DELIVERED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
]);

export const CreateOrderSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  packageName: z.string().min(2, "Package name is required"),
  contractedVideoCount: z.number().int().positive("Video count must be at least 1"),
  pricing: z.number().positive("Pricing must be greater than 0"),
  taxAmount: z.number().min(0, "Tax amount cannot be negative").default(0),
  startDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  assignedTeamId: z.string().optional().nullable(),
  status: OrderStatusEnum.default("NEW"),
});

export const UpdateOrderSchema = z.object({
  packageName: z.string().min(2).optional(),
  contractedVideoCount: z.number().int().positive().optional(),
  pricing: z.number().positive().optional(),
  taxAmount: z.number().min(0).optional(),
  amountReceived: z.number().min(0).optional(),
  startDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  assignedTeamId: z.string().optional().nullable(),
  status: OrderStatusEnum.optional(),
});

// Valid status transitions for orders
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  NEW: ["ONBOARDING", "CANCELLED"],
  ONBOARDING: ["IN_PRODUCTION", "ON_HOLD", "CANCELLED"],
  IN_PRODUCTION: ["PARTIALLY_DELIVERED", "COMPLETED", "ON_HOLD", "CANCELLED"],
  PARTIALLY_DELIVERED: ["COMPLETED", "ON_HOLD"],
  COMPLETED: ["ON_HOLD"],
  ON_HOLD: ["IN_PRODUCTION", "CANCELLED"],
  CANCELLED: [],
};

export function isValidOrderTransition(current: string, next: string): boolean {
  if (current === next) return true;
  const allowed = VALID_ORDER_TRANSITIONS[current] || [];
  return allowed.includes(next);
}
