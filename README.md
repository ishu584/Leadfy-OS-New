# LEADYFY OS — Internal Agency Management & Operations SaaS

> A centralized, high-density operations platform built specifically for modern UGC (User Generated Content) and Digital Marketing Agencies.

---

## Complete Operational Lifecycle

```
Lead / Client → Onboarding → Package / Order → Scripting (Manual) → Creator Match → Shoot → Editing → Internal QA → Client Review → Revisions → Final Delivery → Payout & Reports
```

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Design System**: Amber (`#F59E0B`), Charcoal Black (`#111111`), White (`#FFFFFF`)
- **Database & ORM**: PostgreSQL (Production) / SQLite (Local Zero-Dependency Dev & Testing) with Prisma ORM
- **Validation**: Zod (100% request & model validation)
- **Authentication**: Secure HTTP-only cookies, PBKDF2/bcryptjs password hashing
- **Security & RBAC**: Fine-grained role permissions & query-level client isolation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest automated test suite (9 suites, 21 tests)

---

## Default Development Accounts (Seeded)

All seeded accounts use the password: `Password123!`

| Role | Email | Purpose |
| :--- | :--- | :--- |
| **Owner (Super Admin)** | `owner@leadyfy.com` | Full unrestricted system access, executive financials, net profit, employee salaries |
| **Operations Admin** | `admin@leadyfy.com` | Agency operations, shoots, orders, editor assignments, client tickets |
| **Sales Lead** | `sales@leadyfy.com` | Lead conversion, client onboarding, commercial packages |
| **Senior Scriptwriter** | `writer@leadyfy.com` | Manual UGC scripts authoring, client revision notes |
| **Shoot Director** | `shoot@leadyfy.com` | Creator bookings, shoot logistics, pre-shoot & post-shoot checklists |
| **Lead Video Editor** | `editor@leadyfy.com` | Video editing queue (Overdue, Due Today, Tomorrow, Completed), render links |
| **Client Portal** | `client@lumina.com` | Dedicated isolated brand portal: script approvals, timestamped feedback, downloads |

---

## Quick Start & Local Execution

### 1. Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### 2. Installation
```bash
git clone <repo-url> leadyfy-os
cd leadyfy-os
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```
Default `.env` configuration runs with local SQLite (`file:./dev.db`) out of the box with zero external daemon requirements.

### 4. Database Setup & Seeding
```bash
# Push schema to database
npx prisma db push

# Seed all demo users, orders, scripts, shoots, videos, payments & tickets
node prisma/seed.cjs
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Test Suite

Run the full automated test suite covering authentication, RBAC, the critical client schema flow, creator double-booking prevention, 9-stage video pipeline transitions, financial profit calculations, client portal isolation, and end-to-end lifecycle:

```bash
npm test
# or
npx vitest run
```

---

## Production Build

To verify and compile the optimized production Next.js build:
```bash
npm run build
npm start
```

---

## Key Modules Implemented

1. **Client Management & Hub (`/dashboard/clients` & `/dashboard/clients/[id]`)**:
   - Resolved `company` vs `company_name` ambiguity: `companyName` is canonical in DB, both accepted in API.
   - Comprehensive Client Hub showing active orders, scripts, shoots, videos, invoices, tickets, and activity trail.
2. **Commercial Orders & Production Counters (`/dashboard/orders`)**:
   - Authoritative calculation of Ordered, Assigned, Completed, Delivered, and Remaining Quotas.
   - Outstanding balance auto-calculated (`Total - Received`).
3. **Manual Scripting Desk (`/dashboard/scripts`)**:
   - Zero AI. Manual UGC script authoring with hook, body, and CTA.
   - Strict rule: Cannot transition to `READY_FOR_SHOOT` before client `APPROVED`.
4. **Creator Talent Management (`/dashboard/creators`)**:
   - Vetted directory with contracted rates, availability status, and workload tracking.
5. **Shoot Management & Double-Booking Guard (`/dashboard/shoots`)**:
   - Conflict prevention rejecting overlapping bookings for the same creator on the same date (HTTP 409).
   - Pre-shoot checklists and post-shoot raw footage integrity verification.
6. **9-Stage Video Production Pipeline (`/dashboard/videos`)**:
   - Linear stages: `SCRIPT_APPROVED` → `SHOOT_PENDING` → `RAW_FOOTAGE_RECEIVED` → `VIDEO_EDITING` → `INTERNAL_QA` → `CLIENT_REVIEW` → `REVISION` → `FINAL_APPROVED` → `DELIVERED`.
   - Cannot mark `DELIVERED` without prior `FINAL_APPROVED`.
7. **Lead Video Editor Dashboard (`/dashboard/editor`)**:
   - Work queues grouped into: Overdue, Due Today, Due Tomorrow, Completed.
8. **Dedicated Isolated Client Portal (`/portal`)**:
   - Strict database-level client isolation.
   - Interactive timestamped feedback review (`00:15 - trim the pause`).
   - Final video approval and master delivery download links.
9. **Financial Engine (`/dashboard/payments`, `/dashboard/expenses`, `/dashboard/payouts`)**:
   - Real-time `Net Profit = Revenue - Expenses - Creator Payouts`.
   - Strict duplicate creator payout prevention (unique constraint per video).
   - Restricted access to Owner and Admin.
10. **Operations Suite**:
    - Confidential Employee Directory (`/dashboard/employees`)
    - Priority Tasks Kanban (`/dashboard/tasks`)
    - Client Support Tickets Desk (`/dashboard/tickets`)
    - Tamper-proof Immutable Audit Trail (`/dashboard/audit-logs`)
    - Notification Engine with unread drawer and deduplication.

---

## Additional Documentation

- [Architecture & Lifecycle Layers](docs/architecture.md)
- [Database Schema & PostgreSQL Guide](docs/database.md)
- [REST API Reference](docs/api.md)
- [RBAC & Permissions Matrix](docs/rbac.md)
- [Production Deployment Guide](docs/deployment.md)
- [Backup & Disaster Recovery](docs/backup.md)
- [Testing & Verification Guide](docs/testing.md)
