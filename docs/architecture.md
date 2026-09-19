# LEADYFY OS — Architectural Specification

## System Overview

**LEADYFY OS** is an internal enterprise operations management platform designed specifically for the complete operational lifecycle of a modern UGC (User Generated Content) and Digital Marketing Agency.

### Core Lifecycle Flow
```
Lead / Client
  │
  ▼
Onboarding
  │
  ▼
Package / Order
  │
  ▼
Scripting (Manual, No AI)
  │
  ▼
Creator Match & Workload Allocation
  │
  ▼
Shoot Management & Checklists (Double-Booking Guard)
  │
  ▼
Raw Footage Verification
  │
  ▼
Video Editing (Editor Queue)
  │
  ▼
Internal QA
  │
  ▼
Client Review (Dedicated Isolated Portal)
  │
  ├── [Revision Requested with Timestamp] ──> Returns to Video Editing
  │
  ▼
Final Video Approval
  │
  ▼
Final Delivery Packaging (Cloud & Master Links)
  │
  ▼
Creator Compensation Payouts & Net Profit Financials
```

---

## Architectural Layers

1. **Presentation Layer (Next.js 15 App Router & React 19)**:
   - Modern, high-density minimalist UI strictly implementing Amber (`#F59E0B`), Charcoal Black (`#111111`), and White (`#FFFFFF`).
   - Role-sensitive sidebar dynamically displaying only authorized operational workflows.
   - Dedicated isolated Client Portal layout (`/portal`) with zero access to internal data.

2. **API & Business Logic Layer (Next.js Route Handlers)**:
   - Server-side RBAC authorization guards via `assertPermission()` on every route.
   - Zod validation on incoming payloads with canonical schema normalization (`company` vs `company_name`).
   - Atomic database transactions (`prisma.$transaction`) ensuring consistency across multi-step state transitions.

3. **Data Access & Persistence Layer (Prisma ORM)**:
   - Normalized 20-entity schema with foreign keys, unique constraints, and indices.
   - Authoritative production counters dynamically derived from database records.
   - Strict duplicate prevention for creator payouts via database-level unique constraints.

4. **Storage Abstraction Layer (`lib/storage.ts`)**:
   - `IStorageService` interface enabling seamless switching between local filesystem storage (`/public/uploads`) for local development and cloud providers (S3/Drive) for production.
