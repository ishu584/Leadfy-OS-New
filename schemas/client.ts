import { z } from "zod";

export const ClientStatusEnum = z.enum([
  "LEAD",
  "NEW",
  "ONBOARDING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "INACTIVE",
]);

/**
 * Client Input Schema with robust normalization for `company` vs `company_name`.
 * Canonical representation stored in DB is `companyName`.
 */
export const CreateClientSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    company_name: z.string().min(1, "Company name is required").optional(),
    company: z.string().min(1, "Company name is required").optional(),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(5, "Phone number is required"),
    whatsapp: z.string().optional().nullable(),
    brandName: z.string().min(1, "Brand name is required"),
    industry: z.string().min(1, "Industry is required"),
    taxId: z.string().optional().nullable(),
    assignedEmployeeId: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    status: ClientStatusEnum.default("LEAD"),
    assets: z.string().optional().nullable(),
  })
  .refine((data) => !!(data.company_name || data.company), {
    message: "Company name is required (either 'company_name' or 'company' field)",
    path: ["company_name"],
  })
  .transform((data) => {
    const canonicalCompanyName = (data.company_name || data.company)!.trim();
    return {
      name: data.name.trim(),
      companyName: canonicalCompanyName,
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      whatsapp: data.whatsapp ? data.whatsapp.trim() : null,
      brandName: data.brandName.trim(),
      industry: data.industry.trim(),
      taxId: data.taxId ? data.taxId.trim() : null,
      assignedEmployeeId: data.assignedEmployeeId || null,
      source: data.source ? data.source.trim() : null,
      status: data.status,
      assets: data.assets ? data.assets.trim() : null,
    };
  });

export const UpdateClientSchema = z
  .object({
    name: z.string().min(2).optional(),
    company_name: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    whatsapp: z.string().optional().nullable(),
    brandName: z.string().min(1).optional(),
    industry: z.string().min(1).optional(),
    taxId: z.string().optional().nullable(),
    assignedEmployeeId: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    status: ClientStatusEnum.optional(),
    assets: z.string().optional().nullable(),
  })
  .transform((data) => {
    const canonicalCompanyName = data.company_name || data.company;
    const result: Record<string, any> = {};
    if (data.name !== undefined) result.name = data.name.trim();
    if (canonicalCompanyName !== undefined) result.companyName = canonicalCompanyName.trim();
    if (data.email !== undefined) result.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) result.phone = data.phone.trim();
    if (data.whatsapp !== undefined) result.whatsapp = data.whatsapp ? data.whatsapp.trim() : null;
    if (data.brandName !== undefined) result.brandName = data.brandName.trim();
    if (data.industry !== undefined) result.industry = data.industry.trim();
    if (data.taxId !== undefined) result.taxId = data.taxId ? data.taxId.trim() : null;
    if (data.assignedEmployeeId !== undefined) result.assignedEmployeeId = data.assignedEmployeeId;
    if (data.source !== undefined) result.source = data.source ? data.source.trim() : null;
    if (data.status !== undefined) result.status = data.status;
    if (data.assets !== undefined) result.assets = data.assets ? data.assets.trim() : null;
    return result;
  });

export type CreateClientInput = z.input<typeof CreateClientSchema>;
export type CreateClientOutput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.input<typeof UpdateClientSchema>;
export type UpdateClientOutput = z.infer<typeof UpdateClientSchema>;
