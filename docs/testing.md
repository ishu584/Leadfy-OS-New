# LEADYFY OS — Testing & Verification Guide

## Automated Test Architecture

LEADYFY OS uses Vitest for unit, integration, and end-to-end verification. All business rules, constraints, and lifecycle workflows are verified against actual database records.

---

## Test Suites

1. `tests/auth_rbac.test.ts`
   - Password hashing and bcrypt salt verification
   - Tamper-proof session token creation and verification
   - Multi-tier RBAC matrix checks (Owner, Admin, Sales, Writer, Shoot Mgr, Editor, Client)
   - 403 Forbidden assertion enforcement

2. `tests/client_schema_flow.test.ts`
   - **CRITICAL**: Verification of `company` vs `company_name` schema normalization
   - End-to-end client flow: Payload -> Validation -> DB Insert -> Listing -> Hub -> Edit -> Order Pipeline

3. `tests/order_production.test.ts`
   - Order state transition logic
   - Dynamic production counter derivation (Ordered, Assigned, Completed, Delivered, Remaining Quota)
   - Financial balance calculation

4. `tests/script_workflow.test.ts`
   - Manual scripting state transitions
   - **CRITICAL RULE**: Prevents transitioning to `READY_FOR_SHOOT` before client approval

5. `tests/creator_shoot_conflict.test.ts`
   - Creator registration and rates
   - **CRITICAL RULE**: Double-booking prevention rejecting overlapping confirmed shoots for the same creator

6. `tests/video_pipeline.test.ts`
   - 9-stage video production pipeline transitions
   - **CRITICAL RULE**: Prevents marking `DELIVERED` without prior `FINAL_APPROVED` state
   - Timestamped feedback recording and revision counter incrementing

7. `tests/financial_profit.test.ts`
   - Net profit calculation: `Net Profit = Revenue - Expenses - Payouts`
   - **CRITICAL RULE**: Database unique constraint preventing duplicate creator payouts for the same video

8. `tests/client_portal_isolation.test.ts`
   - Strict data isolation: Client A cannot access Client B
   - Prohibits clients from accessing internal operational/financial endpoints

9. `tests/e2e_agency_lifecycle.test.ts`
   - Complete 14-step agency operational lifecycle executed against live database records

---

## Running the Tests

Execute all tests:
```bash
npx vitest run
```

Run in watch mode during development:
```bash
npm run test:watch
```
