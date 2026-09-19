# LEADYFY OS — RBAC & Permission Architecture

## Overview

LEADYFY OS enforces a multi-tier Role-Based Access Control (RBAC) architecture implemented in `lib/rbac.ts` and evaluated server-side on every request handler via `assertPermission()`.

## Core Roles

1. **OWNER / SUPER ADMIN**:
   - Complete, unrestricted system access.
   - Manages executive financials, net profit, employee salaries, and system configurations.

2. **ADMIN / OPERATIONS MANAGER**:
   - Manages client accounts, commercial packages, orders, shoots, talent booking, editor assignments, invoices, and operational reports.

3. **EMPLOYEE**:
   - Sub-roles tailored to specific production workflows:
     - **SALES**: Lead conversion, onboarding, order configuration.
     - **SCRIPT_WRITER**: Assigned scripts composition, drafting, review responses.
     - **SHOOT_MANAGER**: Talent logistics, shoot schedules, location checklists.
     - **EDITOR**: Assigned video editing queue, draft uploads, QA submissions.

4. **CLIENT**:
   - Strictly isolated to the Client Portal (`/portal`).
   - Zero access to internal data, creator contacts, other clients, employee details, internal costs, or financial reports.

---

## Permission Matrix

| Permission | OWNER | ADMIN | SALES | SCRIPT WRITER | SHOOT MGR | EDITOR | CLIENT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `dashboard:view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `dashboard:financials` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `clients:read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `clients:write` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `orders:read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `orders:write` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `scripts:read` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `scripts:write` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `creators:read` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `creators:write` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `shoots:read` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `shoots:write` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `videos:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `videos:edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `payments:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `payments:write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `expenses:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `expenses:write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `payouts:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `payouts:write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `employees:salaries` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit_logs:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `portal:access` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Client Data Isolation Guarantee

Client isolation is enforced at the query level:
```typescript
if (session.role === "CLIENT") {
  where.clientId = session.clientId;
}
```
A client user can never access or query any entity outside of their own client profile ID.
