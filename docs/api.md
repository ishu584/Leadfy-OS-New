# LEADYFY OS — API Documentation

All API endpoints enforce authentication via secure HTTP-only cookies (`leadyfy_session`) and validate request payloads with Zod.

## Authentication & Session

- `POST /api/auth/login`
  - Body: `{ email: string, password: string }`
  - Returns: `{ success: true, user: SessionUser }`
  - Status: 200 (Success), 401 (Invalid credentials)
- `POST /api/auth/logout`
  - Clears cookie and creates audit log.
- `GET /api/auth/me`
  - Returns authenticated user session or `{ user: null }`.

## Clients & Client Hub

- `GET /api/clients?search=&status=&page=&limit=`
  - Requires: `clients:read`
  - Returns: `{ clients: Client[], pagination: { page, limit, total, totalPages } }`
- `POST /api/clients`
  - Requires: `clients:write`
  - Body: `{ name, company_name (or company), email, phone, whatsapp, brandName, industry, taxId, status, assets }`
  - Returns: `{ success: true, client: Client }`
  - Status: 201 (Created), 400 (Validation Error), 409 (Email Conflict)
- `GET /api/clients/:id`
  - Returns complete client hub: client details, active orders, scripts, shoots, videos, payments, support tickets, and activity logs.
- `PATCH /api/clients/:id`
  - Requires: `clients:write`
  - Updates client profile fields.

## Orders & Production Quotas

- `GET /api/orders?clientId=&status=`
  - Returns orders with dynamically derived `productionCounters`:
    `{ orderedVideos, assignedVideos, completedVideos, deliveredVideos, remainingQuota }`
- `POST /api/orders`
  - Requires: `orders:write`
  - Body: `{ clientId, packageName, contractedVideoCount, pricing, taxAmount, startDate, dueDate }`
  - Atomically creates order and initial payment record.
- `PATCH /api/orders/:id`
  - Validates lifecycle status transitions.

## Manual Scripting Desk

- `GET /api/scripts?clientId=&orderId=&status=`
  - Returns script entries with author, comments count, and client.
- `POST /api/scripts`
  - Requires: `scripts:write`
  - Body: `{ clientId, orderId, videoNumber, language, scriptText, referenceLinks, deadline }`
- `PATCH /api/scripts/:id`
  - Enforces: Cannot transition to `READY_FOR_SHOOT` before client `APPROVED`.
- `POST /api/scripts/:id`
  - Body: `{ commentText: string }` - appends discussion comment to script.

## Creators & Talent Management

- `GET /api/creators?search=&availability=&niche=`
  - Returns creator talent roster with active shoot counts.
- `POST /api/creators`
  - Body: `{ name, gender, ageGroup, languages, location, niches, phone, email, rates, bankDetails, portfolioLinks }`

## Shoots & Double-Booking Guard

- `GET /api/shoots?startDate=&endDate=&status=`
  - Returns scheduled shoots with checklists and verification states.
- `POST /api/shoots`
  - Enforces: Double-booking guard rejecting overlapping confirmed bookings for the same creator on that date (HTTP 409 Conflict).
- `PATCH /api/shoots/:id`
  - Updates shoot state, `preShootChecklist`, and `postShootVerification`.

## 9-Stage Video Production Pipeline

- `GET /api/videos?editorId=&status=`
  - Returns videos in production with feedbacks and assigned editor.
- `PATCH /api/videos/:id`
  - Updates stage, raw footage URL, draft edit URL, final delivery URL.
  - Enforces: Video cannot become `DELIVERED` without prior `FINAL_APPROVED` state.
- `POST /api/videos/:id/feedback`
  - Client review endpoint: accepts `{ timestampCode, feedbackText, action: "REVISION_REQUESTED" | "COMMENT_ONLY" }`.
  - Increments revision count, sets status to `REVISION`, and returns video to assigned editor.
- `POST /api/videos/:id/approve`
  - Client final sign-off: sets status to `FINAL_APPROVED`.

## Financials & Profit Analytics

- `GET /api/payments`
  - Returns payments with invoice and pending balance.
- `POST /api/payments`
  - Records remittance and updates order balance atomically.
- `GET /api/expenses?category=`
  - Returns categorized agency expenses.
- `POST /api/expenses`
  - Logs expense record.
- `GET /api/payouts`
  - Returns creator payout records.
- `POST /api/payouts`
  - Enforces: Unique video constraint preventing duplicate compensation for the same video cut (HTTP 409).
- `GET /api/finances/profit`
  - Restricted to Owner & Admin. Computes:
    `Net Profit = Total Revenue Received - Total Expenses - Total Paid Creator Payouts`.

## Tasks, Tickets, & Audit Logs

- `GET /api/tasks` & `POST /api/tasks` & `PATCH /api/tasks/:id`
- `GET /api/tickets` & `POST /api/tickets` & `POST /api/tickets/:id` (Thread replies)
- `GET /api/audit-logs?entityType=&page=` (Immutable audit records)
- `POST /api/upload` (File storage service upload)
