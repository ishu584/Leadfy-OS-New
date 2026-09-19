# LEADYFY OS — Database Schema & Data Integrity

## Database Architecture

The persistence model is implemented with Prisma ORM. The production standard is PostgreSQL, with zero-friction local development running on SQLite (`dev.db`).

### Schema Entities (20 Entities)

1. **User**: Authentication credentials, roles (`OWNER`, `ADMIN`, `EMPLOYEE`, `CLIENT`), employee sub-roles, active state.
2. **Employee**: Employee code, department, joining date, and confidential salary data.
3. **Client**: Canonical representation with `companyName`, email, brand, taxId (GST), status, and brand kit assets.
4. **Order**: Commercial commitment, contracted video quota, pricing, tax, amount received, balance, start/due dates, and status.
5. **Script**: Manual UGC script texts, video number, author, assigned creator, language, revision count, and approval status.
6. **ScriptComment**: Discussion and feedback thread on scripts.
7. **Creator**: Talent profile, contact, niches, demographics, contracted per-video rate, and availability status.
8. **CreatorAvailability**: Schedule calendar entries tracking booking state per date.
9. **Shoot**: Client, order, creator, location, date, time, pre-shoot checklist JSON, and post-shoot verification JSON.
10. **Video**: 9-stage pipeline state, raw footage link, edit draft link, final delivery link, and revision count.
11. **VideoFeedback**: Timestamped client revision notes (`00:42`), feedback text, and revision number.
12. **Payment**: Invoice amount, amount received, pending balance calculation, payment method, and transaction reference.
13. **Expense**: Categorized agency costs (`SALARIES`, `OFFICE`, `STUDIO`, `EQUIPMENT`, `FUEL`, `PAYOUTS`).
14. **CreatorPayout**: Creator compensation records. Has unique constraint `@@unique([videoId])` preventing duplicate payouts.
15. **Task**: Internal agency task management with priority levels (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
16. **SupportTicket**: Client-to-agency support desk.
17. **TicketResponse**: Support ticket conversation replies.
18. **Notification**: In-app notifications with deduplication.
19. **ActivityLog**: Immutable audit logs capturing actor, action, entity, metadata, and timestamps.
20. **Asset**: Client brand assets and uploaded media files.

---

## Canonical Representation: `company` vs `company_name`

To resolve the potential ambiguity noted in the specification:
- The database table `Client` exclusively defines `companyName` as the single canonical column.
- The Zod validation layer accepts both `company_name` and `company`, normalizing both to `companyName`.
- The API output exposes both `companyName` and a convenience alias `company` to guarantee total backwards and forwards compatibility.

---

## PostgreSQL Production Configuration

To deploy on PostgreSQL, update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/leadyfy_os?schema=public"
```
In `prisma/schema.prisma`, update:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
Then run the production migration command:
```bash
npx prisma migrate deploy
```

> Note: The migration workflow has been initialized with `prisma/migrations/20260918000000_init/migration.sql`. In local development/testing, SQLite is used and verified. For PostgreSQL deployments, apply the migration via `npm run db:migrate` (`prisma migrate deploy`).
