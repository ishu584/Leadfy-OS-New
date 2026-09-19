import { z } from "zod";

export const PaymentStatusEnum = z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"]);

export const RecordPaymentSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  clientId: z.string().min(1, "Client is required"),
  invoiceAmount: z.number().positive("Invoice amount must be positive"),
  amountReceived: z.number().min(0, "Amount received cannot be negative"),
  paymentDate: z.string().or(z.date()).default(() => new Date().toISOString()),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionRef: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ExpenseCategoryEnum = z.enum([
  "SALARIES",
  "OFFICE",
  "STUDIO",
  "EQUIPMENT",
  "FUEL",
  "PAYOUTS",
]);

export const CreateExpenseSchema = z.object({
  category: ExpenseCategoryEnum,
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().or(z.date()).default(() => new Date().toISOString()),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const CreatorPayoutStatusEnum = z.enum(["PENDING", "APPROVED", "PAID"]);

export const CreateCreatorPayoutSchema = z.object({
  creatorId: z.string().min(1, "Creator is required"),
  orderId: z.string().min(1, "Order is required"),
  videoId: z.string().min(1, "Video is required"),
  videoCount: z.number().int().positive().default(1),
  contractedRate: z.number().positive("Rate must be greater than 0"),
  paymentDate: z.string().or(z.date()).optional().nullable(),
  transactionRef: z.string().optional().nullable(),
  status: CreatorPayoutStatusEnum.default("PENDING"),
});
