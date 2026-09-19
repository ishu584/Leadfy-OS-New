import { describe, it, expect } from "vitest";
import { canAccessClient, hasPermission, SessionUser } from "../lib/rbac";

describe("Dedicated Client Portal Isolation Suite", () => {
  const clientA: SessionUser = {
    id: "user_a",
    email: "client.a@brand.com",
    name: "Client A",
    role: "CLIENT",
    clientId: "client_company_A",
  };

  const clientB: SessionUser = {
    id: "user_b",
    email: "client.b@brand.com",
    name: "Client B",
    role: "CLIENT",
    clientId: "client_company_B",
  };

  const admin: SessionUser = {
    id: "admin_1",
    email: "admin@leadyfy.com",
    name: "Operations Admin",
    role: "ADMIN",
  };

  it("strictly prohibits Client A from accessing Client B data", () => {
    // Client A accessing own data
    expect(canAccessClient(clientA, "client_company_A")).toBe(true);

    // Client A attempting to access Client B data
    expect(canAccessClient(clientA, "client_company_B")).toBe(false);

    // Client B accessing own data
    expect(canAccessClient(clientB, "client_company_B")).toBe(true);

    // Client B attempting to access Client A data
    expect(canAccessClient(clientB, "client_company_A")).toBe(false);
  });

  it("prohibits clients from accessing internal agency endpoints", () => {
    expect(hasPermission(clientA, "dashboard:financials")).toBe(false);
    expect(hasPermission(clientA, "employees:read")).toBe(false);
    expect(hasPermission(clientA, "employees:salaries")).toBe(false);
    expect(hasPermission(clientA, "creators:read")).toBe(false);
    expect(hasPermission(clientA, "audit_logs:read")).toBe(false);
    expect(hasPermission(clientA, "expenses:read")).toBe(false);

    // But grants portal access
    expect(hasPermission(clientA, "portal:access")).toBe(true);
  });

  it("allows internal Operations Admin to access client operational records", () => {
    expect(canAccessClient(admin, "client_company_A")).toBe(true);
    expect(canAccessClient(admin, "client_company_B")).toBe(true);
  });
});
