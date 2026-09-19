export type UserRole = "OWNER" | "ADMIN" | "EMPLOYEE" | "CLIENT";

export type EmployeeRole = "SALES" | "SCRIPT_WRITER" | "SHOOT_MANAGER" | "EDITOR";

export type Permission =
  | "dashboard:view"
  | "dashboard:financials"
  | "clients:read"
  | "clients:write"
  | "clients:delete"
  | "orders:read"
  | "orders:write"
  | "orders:delete"
  | "scripts:read"
  | "scripts:write"
  | "scripts:review"
  | "creators:read"
  | "creators:write"
  | "shoots:read"
  | "shoots:write"
  | "videos:read"
  | "videos:edit"
  | "videos:approve"
  | "payments:read"
  | "payments:write"
  | "expenses:read"
  | "expenses:write"
  | "payouts:read"
  | "payouts:write"
  | "employees:read"
  | "employees:write"
  | "employees:salaries"
  | "tasks:read"
  | "tasks:write"
  | "tickets:read"
  | "tickets:write"
  | "audit_logs:read"
  | "reports:read"
  | "settings:manage"
  | "portal:access";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeRole?: EmployeeRole | null;
  clientId?: string | null;
  avatar?: string | null;
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    "dashboard:view",
    "dashboard:financials",
    "clients:read",
    "clients:write",
    "clients:delete",
    "orders:read",
    "orders:write",
    "orders:delete",
    "scripts:read",
    "scripts:write",
    "scripts:review",
    "creators:read",
    "creators:write",
    "shoots:read",
    "shoots:write",
    "videos:read",
    "videos:edit",
    "videos:approve",
    "payments:read",
    "payments:write",
    "expenses:read",
    "expenses:write",
    "payouts:read",
    "payouts:write",
    "employees:read",
    "employees:write",
    "employees:salaries",
    "tasks:read",
    "tasks:write",
    "tickets:read",
    "tickets:write",
    "audit_logs:read",
    "reports:read",
    "settings:manage",
  ],
  ADMIN: [
    "dashboard:view",
    "dashboard:financials",
    "clients:read",
    "clients:write",
    "orders:read",
    "orders:write",
    "scripts:read",
    "scripts:write",
    "scripts:review",
    "creators:read",
    "creators:write",
    "shoots:read",
    "shoots:write",
    "videos:read",
    "videos:edit",
    "videos:approve",
    "payments:read",
    "payments:write",
    "expenses:read",
    "payouts:read",
    "payouts:write",
    "employees:read",
    "tasks:read",
    "tasks:write",
    "tickets:read",
    "tickets:write",
    "audit_logs:read",
    "reports:read",
  ],
  EMPLOYEE: [
    "dashboard:view",
    "tasks:read",
    "tasks:write",
    "tickets:read",
    "tickets:write",
  ],
  CLIENT: [
    "portal:access",
  ],
};

const EMPLOYEE_ROLE_PERMISSIONS: Record<EmployeeRole, Permission[]> = {
  SALES: [
    "clients:read",
    "clients:write",
    "orders:read",
    "orders:write",
  ],
  SCRIPT_WRITER: [
    "scripts:read",
    "scripts:write",
  ],
  SHOOT_MANAGER: [
    "creators:read",
    "creators:write",
    "shoots:read",
    "shoots:write",
    "scripts:read",
  ],
  EDITOR: [
    "videos:read",
    "videos:edit",
  ],
};

/**
 * Checks if a user has a specific permission based on their role and employee sub-role.
 */
export function hasPermission(user: SessionUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === "OWNER") return true;

  const basePermissions = ROLE_PERMISSIONS[user.role] || [];
  if (basePermissions.includes(permission)) return true;

  if (user.role === "EMPLOYEE" && user.employeeRole) {
    const subPermissions = EMPLOYEE_ROLE_PERMISSIONS[user.employeeRole] || [];
    return subPermissions.includes(permission);
  }

  return false;
}

/**
 * Checks if a user has access to a specific client's data.
 * Clients can ONLY access their own client ID.
 * Internal staff can access according to role permissions.
 */
export function canAccessClient(user: SessionUser, targetClientId: string): boolean {
  if (user.role === "OWNER" || user.role === "ADMIN") return true;
  if (user.role === "CLIENT") {
    return user.clientId === targetClientId;
  }
  if (user.role === "EMPLOYEE") {
    return true; // Staff can view client operational assets
  }
  return false;
}

/**
 * Strict server-side assertion: throws 403 error if permission not met.
 */
export function assertPermission(user: SessionUser | null | undefined, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    const err = new Error("Forbidden: You do not have permission to perform this action.");
    (err as any).statusCode = 403;
    throw err;
  }
}
