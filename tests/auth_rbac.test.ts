import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "../lib/crypto";
import { hasPermission, assertPermission, SessionUser } from "../lib/rbac";

describe("Authentication & RBAC Security Suite", () => {
  const secret = "test-secret-key-12345678901234567890";

  it("hashes password and verifies matching password correctly", async () => {
    const raw = "SecurePass123!";
    const hashed = await hashPassword(raw);
    expect(hashed).not.toBe(raw);
    const valid = await verifyPassword(raw, hashed);
    expect(valid).toBe(true);

    const invalid = await verifyPassword("WrongPassword!", hashed);
    expect(invalid).toBe(false);
  });

  it("creates and decodes tamper-proof session tokens", () => {
    const user = { id: "usr_1", email: "admin@leadyfy.com", role: "ADMIN" };
    const token = createSessionToken(user, secret);
    expect(token).toBeTruthy();

    const decoded = verifySessionToken<typeof user>(token, secret);
    expect(decoded).toBeTruthy();
    expect(decoded?.id).toBe("usr_1");
    expect(decoded?.email).toBe("admin@leadyfy.com");

    // Fails on tampered token
    const tampered = token.slice(0, -5) + "abcde";
    const invalidDecoded = verifySessionToken(tampered, secret);
    expect(invalidDecoded).toBeNull();
  });

  it("enforces role permissions matrix correctly", () => {
    const owner: SessionUser = { id: "1", email: "o@l.com", name: "Owner", role: "OWNER" };
    const admin: SessionUser = { id: "2", email: "a@l.com", name: "Admin", role: "ADMIN" };
    const sales: SessionUser = { id: "3", email: "s@l.com", name: "Sales", role: "EMPLOYEE", employeeRole: "SALES" };
    const writer: SessionUser = { id: "4", email: "w@l.com", name: "Writer", role: "EMPLOYEE", employeeRole: "SCRIPT_WRITER" };
    const editor: SessionUser = { id: "5", email: "e@l.com", name: "Editor", role: "EMPLOYEE", employeeRole: "EDITOR" };
    const client: SessionUser = { id: "6", email: "c@l.com", name: "Client", role: "CLIENT", clientId: "cli_1" };

    // Owner has unrestricted access
    expect(hasPermission(owner, "dashboard:financials")).toBe(true);
    expect(hasPermission(owner, "employees:salaries")).toBe(true);
    expect(hasPermission(owner, "clients:delete")).toBe(true);

    // Admin has operational & financial access, but not sensitive salary by default
    expect(hasPermission(admin, "dashboard:financials")).toBe(true);
    expect(hasPermission(admin, "clients:write")).toBe(true);
    expect(hasPermission(admin, "employees:salaries")).toBe(false);

    // Sales can read/write clients & orders, but cannot see financials or edit videos
    expect(hasPermission(sales, "clients:write")).toBe(true);
    expect(hasPermission(sales, "orders:write")).toBe(true);
    expect(hasPermission(sales, "dashboard:financials")).toBe(false);
    expect(hasPermission(sales, "videos:edit")).toBe(false);

    // Script Writer can only manage scripts
    expect(hasPermission(writer, "scripts:write")).toBe(true);
    expect(hasPermission(writer, "clients:write")).toBe(false);

    // Editor can only edit videos
    expect(hasPermission(editor, "videos:edit")).toBe(true);
    expect(hasPermission(editor, "scripts:write")).toBe(false);

    // Client only has portal access
    expect(hasPermission(client, "portal:access")).toBe(true);
    expect(hasPermission(client, "clients:read")).toBe(false);
    expect(hasPermission(client, "dashboard:financials")).toBe(false);
  });

  it("assertPermission throws 403 when unauthorized", () => {
    const editor: SessionUser = { id: "5", email: "e@l.com", name: "Editor", role: "EMPLOYEE", employeeRole: "EDITOR" };

    expect(() => assertPermission(editor, "videos:edit")).not.toThrow();
    expect(() => assertPermission(editor, "dashboard:financials")).toThrow("Forbidden");
  });
});
