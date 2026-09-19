import { describe, it, expect } from "vitest";
import { CreateClientSchema, UpdateClientSchema } from "../schemas/client";
import { prisma } from "../lib/prisma";
import { ensureDatabaseConnection } from "./db-helper";

describe("CRITICAL: Client Schema Canonicalization & Complete Flow", () => {
  it("validates and canonicalizes payloads with either 'company_name' or 'company'", () => {
    // 1. Using company_name
    const payload1 = {
      name: "Marcus Aurelius",
      company_name: "Stoa Wellness Ltd",
      email: "stoa@example.com",
      phone: "+15551112222",
      brandName: "Stoa",
      industry: "Health",
    };
    const parsed1 = CreateClientSchema.parse(payload1);
    expect(parsed1.companyName).toBe("Stoa Wellness Ltd");

    // 2. Using legacy or alternate 'company' field
    const payload2 = {
      name: "Seneca Dial",
      company: "Lucid Flow Brands Inc",
      email: "lucid@example.com",
      phone: "+15553334444",
      brandName: "Lucid Flow",
      industry: "Supplements",
    };
    const parsed2 = CreateClientSchema.parse(payload2);
    expect(parsed2.companyName).toBe("Lucid Flow Brands Inc");

    // 3. Fails if neither is provided
    const payloadInvalid = {
      name: "No Company Guy",
      email: "nocompany@example.com",
      phone: "+15553334444",
      brandName: "Solo",
      industry: "Tech",
    };
    expect(() => CreateClientSchema.parse(payloadInvalid)).toThrow();
  });

  it("executes the complete client lifecycle in the database: Insert -> Query -> Hub -> Edit -> Order Pipeline", async (ctx) => {
    if (!(await ensureDatabaseConnection(ctx))) return;
    const uniqueEmail = `test.client.${Date.now()}@agencytest.com`;

    // Step 1: Form & Validation Payload (testing 'company' compatibility)
    const formInput = {
      name: "Victoria Stone",
      company: "Aura Skincare Labs LLC", // submitted as 'company'
      email: uniqueEmail,
      phone: "+1 (555) 999-8888",
      whatsapp: "+1 (555) 999-8888",
      brandName: "Aura Glow",
      industry: "D2C Cosmetics",
      status: "NEW" as const,
    };
    const validated = CreateClientSchema.parse(formInput);
    expect(validated.companyName).toBe("Aura Skincare Labs LLC");

    // Step 2: Database Insert into canonical companyName column
    const createdClient = await prisma.client.create({
      data: validated,
    });
    expect(createdClient.id).toBeTruthy();
    expect(createdClient.companyName).toBe("Aura Skincare Labs LLC");

    // Step 3: Client Listing Query
    const foundInList = await prisma.client.findFirst({
      where: { companyName: "Aura Skincare Labs LLC" },
    });
    expect(foundInList).toBeTruthy();
    expect(foundInList?.id).toBe(createdClient.id);

    // Step 4: Edit Client using UpdateClientSchema
    const editPayload = {
      company_name: "Aura Skincare Laboratories Global",
      status: "ACTIVE" as const,
    };
    const validatedEdit = UpdateClientSchema.parse(editPayload);
    const updatedClient = await prisma.client.update({
      where: { id: createdClient.id },
      data: validatedEdit,
    });
    expect(updatedClient.companyName).toBe("Aura Skincare Laboratories Global");
    expect(updatedClient.status).toBe("ACTIVE");

    // Step 5: Associated Order Pipeline
    const order = await prisma.order.create({
      data: {
        clientId: createdClient.id,
        packageName: "Viral Launch 5-Pack",
        contractedVideoCount: 5,
        pricing: 1500,
        taxAmount: 270,
        totalAmount: 1770,
        amountReceived: 1770,
        outstandingBalance: 0,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "IN_PRODUCTION",
      },
    });
    expect(order.id).toBeTruthy();
    expect(order.clientId).toBe(createdClient.id);

    // Clean up test client
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.client.delete({ where: { id: createdClient.id } });
  });
});
