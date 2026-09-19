-- =========================================================================
-- LEADYFY OS - Production PostgreSQL Initial Data Migration from dev.db
-- Generated: 2026-09-19T18:05:26.658Z
-- Preserves all original CUID IDs, bcrypt password hashes, and relations
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- Table: "User" (7 records)
-- -------------------------------------------------------------------------
INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "employeeRole", "avatar", "active", "createdAt", "updatedAt")
VALUES ('cmu87i47l00002ght4h41wchn', 'owner@leadyfy.com', '$2b$10$Uvr7O3/hvu8.SO2/K.MfQebkLFnmUEC/n2JPpNqGeZ2yN/JgnKnqW', 'Marcus Vance (Owner)', 'OWNER', NULL, NULL, TRUE, '2026-09-19T09:50:12.178Z'::TIMESTAMP(3), '2026-09-19T09:50:12.178Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "employeeRole", "avatar", "active", "createdAt", "updatedAt")
VALUES ('cmu87i47o00012ghtj4bhtj0q', 'admin@leadyfy.com', '$2b$10$Uvr7O3/hvu8.SO2/K.MfQebkLFnmUEC/n2JPpNqGeZ2yN/JgnKnqW', 'Elena Rostova (Operations Admin)', 'ADMIN', NULL, NULL, TRUE, '2026-09-19T09:50:12.181Z'::TIMESTAMP(3), '2026-09-19T09:50:12.181Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "employeeRole", "avatar", "active", "createdAt", "updatedAt")
VALUES ('cmu87i47q00022ghtftdyb2hu', 'sales@leadyfy.com', '$2b$10$Uvr7O3/hvu8.SO2/K.MfQebkLFnmUEC/n2JPpNqGeZ2yN/JgnKnqW', 'Sarah Jenkins (Sales Lead)', 'EMPLOYEE', 'SALES', NULL, TRUE, '2026-09-19T09:50:12.183Z'::TIMESTAMP(3), '2026-09-19T09:50:12.183Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "employeeRole", "avatar", "active", "createdAt", "updatedAt")
VALUES ('cmu87i47s00032ghtuylfgt18', 'writer@leadyfy.com', '$2b$10$Uvr7O3/hvu8.SO2/K.MfQebkLFnmUEC/n2JPpNqGeZ2yN/JgnKnqW', 'David Chen (Senior Scriptwriter)', 'EMPLOYEE', 'SCRIPT_WRITER', NULL, TRUE, '2026-09-19T09:50:12.184Z'::TIMESTAMP(3), '2026-09-19T09:50:12.184Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "employeeRole", "avatar", "active", "createdAt", "updatedAt")
VALUES ('cmu87i47u00042ght8cobz2n1', 'shoot@leadyfy.com', '$2b$10$Uvr7O3/hvu8.SO2/K.MfQebkLFnmUEC/n2JPpNqGeZ2yN/JgnKnqW', 'Chloe Bennett (Shoot Director)', 'EMPLOYEE', 'SHOOT_MANAGER', NULL, TRUE, '2026-09-19T09:50:12.186Z'::TIMESTAMP(3), '2026-09-19T09:50:12.186Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "employeeRole", "avatar", "active", "createdAt", "updatedAt")
VALUES ('cmu87i47v00052ghtzqqhnimf', 'editor@leadyfy.com', '$2b$10$Uvr7O3/hvu8.SO2/K.MfQebkLFnmUEC/n2JPpNqGeZ2yN/JgnKnqW', 'Alex Rivera (Lead Video Editor)', 'EMPLOYEE', 'EDITOR', NULL, TRUE, '2026-09-19T09:50:12.187Z'::TIMESTAMP(3), '2026-09-19T09:50:12.187Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "employeeRole", "avatar", "active", "createdAt", "updatedAt")
VALUES ('cmu87i47w00062ghtmcmirudr', 'client@lumina.com', '$2b$10$Uvr7O3/hvu8.SO2/K.MfQebkLFnmUEC/n2JPpNqGeZ2yN/JgnKnqW', 'Sophia Carter (Brand VP)', 'CLIENT', NULL, NULL, TRUE, '2026-09-19T09:50:12.189Z'::TIMESTAMP(3), '2026-09-19T09:50:12.189Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Creator" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "Creator" ("id", "name", "photo", "gender", "ageGroup", "languages", "location", "niches", "demographics", "phone", "email", "rates", "bankDetails", "portfolioLinks", "availabilityStatus", "createdAt", "updatedAt")
VALUES ('cmu87i487000j2ghtvz8q2co6', 'Aarav Mehta', NULL, 'Male', '22-28', 'English, Hindi', 'Mumbai, MH', 'Skincare, Grooming, D2C Tech', 'Gen Z & Millennial urban audience', '+91 98765 43210', 'aarav.ugc@example.com', 250, 'aarav@upi / HDFC0001234', 'https://instagram.com/aarav_creates', 'AVAILABLE', '2026-09-19T09:50:12.199Z'::TIMESTAMP(3), '2026-09-19T09:50:12.199Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Creator" ("id", "name", "photo", "gender", "ageGroup", "languages", "location", "niches", "demographics", "phone", "email", "rates", "bankDetails", "portfolioLinks", "availabilityStatus", "createdAt", "updatedAt")
VALUES ('cmu87i488000k2ghtk578c8nw', 'Priya Sharma', NULL, 'Female', '25-32', 'English, Hindi, Marathi', 'Delhi NCR', 'Fitness, Wellness, Skincare', 'Tier 1 Working Professionals', '+91 98111 22334', 'priya.ugc@example.com', 300, 'priya@upi / ICIC0005678', 'https://tiktok.com/@priya_wellness', 'AVAILABLE', '2026-09-19T09:50:12.201Z'::TIMESTAMP(3), '2026-09-19T09:50:12.201Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "ActivityLog" (3 records)
-- -------------------------------------------------------------------------
INSERT INTO "ActivityLog" ("id", "actorId", "actorName", "action", "entityType", "entityId", "metadata", "ipAddress", "createdAt")
VALUES ('cmu87i491001r2ghtf886lvzh', 'cmu87i47o00012ghtj4bhtj0q', 'Elena Rostova', 'CLIENT_ONBOARDED', 'CLIENT', 'cmu87i484000g2ghtsvscxuys', '{"companyName":"Lumina Glow Skincare Pvt Ltd","status":"ACTIVE"}', NULL, '2026-09-19T09:50:12.230Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ActivityLog" ("id", "actorId", "actorName", "action", "entityType", "entityId", "metadata", "ipAddress", "createdAt")
VALUES ('cmu87i492001s2ghtp17av6h4', 'cmu87i47w00062ghtmcmirudr', 'Sophia Carter', 'FEEDBACK_SUBMITTED', 'VIDEO', 'cmu87i48j00102ghtvq93nutv', '{"timestamp":"00:14","revision":1}', NULL, '2026-09-19T09:50:12.231Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ActivityLog" ("id", "actorId", "actorName", "action", "entityType", "entityId", "metadata", "ipAddress", "createdAt")
VALUES ('cmu87jgsv00002gjlr95hyqo6', 'cmu87i47l00002ght4h41wchn', 'Marcus Vance (Owner)', 'USER_LOGIN', 'USER', 'cmu87i47l00002ght4h41wchn', '{"role":"OWNER"}', '::1', '2026-09-19T09:51:15.152Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Employee" (4 records)
-- -------------------------------------------------------------------------
INSERT INTO "Employee" ("id", "userId", "employeeCode", "roleType", "salary", "joiningDate", "department", "createdAt", "updatedAt")
VALUES ('cmu87i47z00082ghtpwyd7bgh', 'cmu87i47q00022ghtftdyb2hu', 'EMP-SALES-01', 'SALES', 65000, '2024-01-15T00:00:00.000Z'::TIMESTAMP(3), 'Client Growth & Acquisitions', '2026-09-19T09:50:12.191Z'::TIMESTAMP(3), '2026-09-19T09:50:12.191Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Employee" ("id", "userId", "employeeCode", "roleType", "salary", "joiningDate", "department", "createdAt", "updatedAt")
VALUES ('cmu87i480000a2ghtjwim641o', 'cmu87i47s00032ghtuylfgt18', 'EMP-SCR-02', 'SCRIPT_WRITER', 58000, '2024-02-01T00:00:00.000Z'::TIMESTAMP(3), 'Creative Writing', '2026-09-19T09:50:12.192Z'::TIMESTAMP(3), '2026-09-19T09:50:12.192Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Employee" ("id", "userId", "employeeCode", "roleType", "salary", "joiningDate", "department", "createdAt", "updatedAt")
VALUES ('cmu87i481000c2ght5wbbfe8m', 'cmu87i47u00042ght8cobz2n1', 'EMP-SHT-03', 'SHOOT_MANAGER', 62000, '2024-02-15T00:00:00.000Z'::TIMESTAMP(3), 'Production & Logistics', '2026-09-19T09:50:12.194Z'::TIMESTAMP(3), '2026-09-19T09:50:12.194Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Employee" ("id", "userId", "employeeCode", "roleType", "salary", "joiningDate", "department", "createdAt", "updatedAt")
VALUES ('cmu87i482000e2ghtupdsqhxz', 'cmu87i47v00052ghtzqqhnimf', 'EMP-EDT-04', 'EDITOR', 60000, '2024-03-01T00:00:00.000Z'::TIMESTAMP(3), 'Post-Production', '2026-09-19T09:50:12.195Z'::TIMESTAMP(3), '2026-09-19T09:50:12.195Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Client" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "Client" ("id", "userId", "name", "companyName", "email", "phone", "whatsapp", "brandName", "industry", "taxId", "assignedEmployeeId", "source", "status", "assets", "createdAt", "updatedAt")
VALUES ('cmu87i484000g2ghtsvscxuys', 'cmu87i47w00062ghtmcmirudr', 'Sophia Carter', 'Lumina Glow Skincare Pvt Ltd', 'client@lumina.com', '+1 (555) 234-5678', '+1 (555) 234-5678', 'Lumina Glow', 'Beauty & D2C Cosmetics', 'GST-LUMINA-8899', 'cmu87i47q00022ghtftdyb2hu', 'Inbound Marketing', 'ACTIVE', 'https://drive.google.com/drive/folders/lumina-brand-kit-sample', '2026-09-19T09:50:12.196Z'::TIMESTAMP(3), '2026-09-19T09:50:12.196Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Client" ("id", "userId", "name", "companyName", "email", "phone", "whatsapp", "brandName", "industry", "taxId", "assignedEmployeeId", "source", "status", "assets", "createdAt", "updatedAt")
VALUES ('cmu87i485000i2ghtfxfs3do8', NULL, 'Liam O''Connor', 'Nova Energy Supplements Inc', 'liam@novaenergy.io', '+1 (555) 876-5432', '+1 (555) 876-5432', 'Nova Energy', 'Health & Wellness', 'GST-NOVA-1024', 'cmu87i47q00022ghtftdyb2hu', 'Referral', 'ONBOARDING', NULL, '2026-09-19T09:50:12.198Z'::TIMESTAMP(3), '2026-09-19T09:50:12.198Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "CreatorAvailability" (0 records)
-- -------------------------------------------------------------------------
-- (No records in dev.db)

-- -------------------------------------------------------------------------
-- Table: "Expense" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "Expense" ("id", "category", "amount", "recordedById", "date", "receiptUrl", "notes", "createdAt", "updatedAt")
VALUES ('cmu87i48q001a2ghtxdsnsg4w', 'STUDIO', 450, 'cmu87i47o00012ghtj4bhtj0q', '2026-09-19T09:50:12.218Z'::TIMESTAMP(3), NULL, 'Studio 4A half-day rental booking with lighting kit', '2026-09-19T09:50:12.219Z'::TIMESTAMP(3), '2026-09-19T09:50:12.219Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Expense" ("id", "category", "amount", "recordedById", "date", "receiptUrl", "notes", "createdAt", "updatedAt")
VALUES ('cmu87i48r001c2ghtu67vp1zh', 'EQUIPMENT', 180, 'cmu87i47u00042ght8cobz2n1', '2026-09-19T09:50:12.219Z'::TIMESTAMP(3), NULL, 'Wireless lavalier microphone kit rental & props', '2026-09-19T09:50:12.220Z'::TIMESTAMP(3), '2026-09-19T09:50:12.220Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Task" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "Task" ("id", "title", "description", "assigneeId", "priority", "deadline", "status", "attachments", "createdAt", "updatedAt")
VALUES ('cmu87i48u001g2ghtzb7uv9jw', 'Review draft edit cut for Lumina Video #1', 'Verify color grading matches brand palette and check client revision notes at 00:14.', 'cmu87i47v00052ghtzqqhnimf', 'URGENT', '2026-09-20T09:50:12.222Z'::TIMESTAMP(3), 'IN_PROGRESS', NULL, '2026-09-19T09:50:12.222Z'::TIMESTAMP(3), '2026-09-19T09:50:12.222Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Task" ("id", "title", "description", "assigneeId", "priority", "deadline", "status", "attachments", "createdAt", "updatedAt")
VALUES ('cmu87i48v001i2ghtokqj4xbr', 'Schedule creator fitting and product dispatch for Nova Energy', 'Send 3 cans of Nova Energy Citrus Blast to Priya Sharma for script testing.', 'cmu87i47u00042ght8cobz2n1', 'HIGH', '2026-09-21T09:50:12.223Z'::TIMESTAMP(3), 'TO_DO', NULL, '2026-09-19T09:50:12.224Z'::TIMESTAMP(3), '2026-09-19T09:50:12.224Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Notification" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "Notification" ("id", "recipientId", "type", "title", "message", "entityType", "entityId", "isRead", "createdAt")
VALUES ('cmu87i48z001o2ght201fbagm', 'cmu87i47v00052ghtzqqhnimf', 'VIDEO_REVISION', 'Client Feedback Received', 'Lumina Glow has provided timestamped revision notes for Video #1.', 'VIDEO', 'cmu87i48j00102ghtvq93nutv', FALSE, '2026-09-19T09:50:12.227Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Notification" ("id", "recipientId", "type", "title", "message", "entityType", "entityId", "isRead", "createdAt")
VALUES ('cmu87i490001q2ghtb2t5rvmj', 'cmu87i47l00002ght4h41wchn', 'PAYMENT_RECORDED', 'Payment Received ($2,950)', 'Full payment received for Lumina Glow Scale UGC 10-Pack.', 'PAYMENT', 'cmu87i48a000m2ght8z1bzw62', FALSE, '2026-09-19T09:50:12.229Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Order" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "Order" ("id", "clientId", "packageName", "contractedVideoCount", "pricing", "taxAmount", "totalAmount", "amountReceived", "outstandingBalance", "startDate", "dueDate", "assignedTeamId", "status", "createdAt", "updatedAt")
VALUES ('cmu87i48a000m2ght8z1bzw62', 'cmu87i484000g2ghtsvscxuys', 'Scale UGC 10-Pack', 10, 2500, 450, 2950, 2950, 0, '2025-01-10T00:00:00.000Z'::TIMESTAMP(3), '2025-02-28T00:00:00.000Z'::TIMESTAMP(3), 'cmu87i47s00032ghtuylfgt18', 'IN_PRODUCTION', '2026-09-19T09:50:12.202Z'::TIMESTAMP(3), '2026-09-19T09:50:12.202Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Order" ("id", "clientId", "packageName", "contractedVideoCount", "pricing", "taxAmount", "totalAmount", "amountReceived", "outstandingBalance", "startDate", "dueDate", "assignedTeamId", "status", "createdAt", "updatedAt")
VALUES ('cmu87i48b000o2ghtwybdhh6z', 'cmu87i485000i2ghtfxfs3do8', 'Starter UGC 4-Pack', 4, 1200, 216, 1416, 700, 716, '2025-02-01T00:00:00.000Z'::TIMESTAMP(3), '2025-03-15T00:00:00.000Z'::TIMESTAMP(3), 'cmu87i47q00022ghtftdyb2hu', 'ONBOARDING', '2026-09-19T09:50:12.203Z'::TIMESTAMP(3), '2026-09-19T09:50:12.203Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "SupportTicket" (1 records)
-- -------------------------------------------------------------------------
INSERT INTO "SupportTicket" ("id", "clientId", "subject", "message", "priority", "status", "assignedToId", "createdAt", "updatedAt")
VALUES ('cmu87i48w001k2ghtlqm55qxu', 'cmu87i484000g2ghtsvscxuys', 'Requesting additional aspect ratio cuts (4:5 and 16:9)', 'Hi team, we would love to run Video #2 on Facebook and YouTube Shorts as well. Can we get 4:5 and 16:9 crops?', 'MEDIUM', 'IN_PROGRESS', 'cmu87i47o00012ghtj4bhtj0q', '2026-09-19T09:50:12.225Z'::TIMESTAMP(3), '2026-09-19T09:50:12.225Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Asset" (0 records)
-- -------------------------------------------------------------------------
-- (No records in dev.db)

-- -------------------------------------------------------------------------
-- Table: "Script" (3 records)
-- -------------------------------------------------------------------------
INSERT INTO "Script" ("id", "clientId", "orderId", "videoNumber", "writerId", "creatorId", "language", "scriptText", "referenceLinks", "deadline", "revisionCount", "status", "createdAt", "updatedAt")
VALUES ('cmu87i48c000q2ghthayg3dyo', 'cmu87i484000g2ghtsvscxuys', 'cmu87i48a000m2ght8z1bzw62', 1, 'cmu87i47s00032ghtuylfgt18', 'cmu87i487000j2ghtvz8q2co6', 'English', '[HOOK - 0:00 to 0:03]:
"Stop scrolling if you have dull winter skin!" (Creator touches face in mirror)

[PROBLEM - 0:03 to 0:10]:
"I tried 5 different serums and none worked, until my dermatologist told me about Lumina Glow Vitamin C."

[SOLUTION & DEMO - 0:10 to 0:25]:
(Applies 3 drops directly onto cheek. Smooth glass-skin transition shot)
"It absorbs in 5 seconds with zero sticky residue and 10% active ascorbyl glucoside."

[CTA - 0:25 to 0:30]:
"Tap the link below to get 20% off your first bottle before it sells out again."', 'https://example.com/tiktok-ref-hook-1', '2025-02-15T00:00:00.000Z'::TIMESTAMP(3), 1, 'APPROVED', '2026-09-19T09:50:12.205Z'::TIMESTAMP(3), '2026-09-19T09:50:12.205Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Script" ("id", "clientId", "orderId", "videoNumber", "writerId", "creatorId", "language", "scriptText", "referenceLinks", "deadline", "revisionCount", "status", "createdAt", "updatedAt")
VALUES ('cmu87i48e000s2ght4sb5su0r', 'cmu87i484000g2ghtsvscxuys', 'cmu87i48a000m2ght8z1bzw62', 2, 'cmu87i47s00032ghtuylfgt18', 'cmu87i487000j2ghtvz8q2co6', 'English', '[HOOK]:
"Here is the exact nighttime routine that cleared my hyperpigmentation in 30 days."

[BODY]:
"Double cleanse, gentle toner, then lock in moisture with Lumina Barrier Ceramide Balm. Watch how glowing my skin looks waking up."

[CTA]:
"Available online today with 30-day money-back guarantee."', NULL, '2025-02-18T00:00:00.000Z'::TIMESTAMP(3), 0, 'READY_FOR_SHOOT', '2026-09-19T09:50:12.206Z'::TIMESTAMP(3), '2026-09-19T09:50:12.206Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Script" ("id", "clientId", "orderId", "videoNumber", "writerId", "creatorId", "language", "scriptText", "referenceLinks", "deadline", "revisionCount", "status", "createdAt", "updatedAt")
VALUES ('cmu87i48f000u2ghtsop4bpru', 'cmu87i484000g2ghtsvscxuys', 'cmu87i48a000m2ght8z1bzw62', 3, 'cmu87i47s00032ghtuylfgt18', NULL, 'English', '[HOOK]: "Does this viral sunscreen stick leave a white cast on darker skin tones? Let''s test it in direct sunlight!"', NULL, '2025-02-25T00:00:00.000Z'::TIMESTAMP(3), 0, 'SENT_TO_CLIENT', '2026-09-19T09:50:12.208Z'::TIMESTAMP(3), '2026-09-19T09:50:12.208Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Payment" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "Payment" ("id", "orderId", "clientId", "invoiceAmount", "amountReceived", "pendingBalance", "paymentDate", "paymentMethod", "transactionRef", "notes", "status", "createdAt", "updatedAt")
VALUES ('cmu87i48n00162ght7vj13o7m', 'cmu87i48a000m2ght8z1bzw62', 'cmu87i484000g2ghtsvscxuys', 2950, 2950, 0, '2026-09-19T09:50:12.216Z'::TIMESTAMP(3), 'Bank Wire Transfer', 'TXN-LUM-20250110', 'Full payment received upon onboarding confirmation.', 'PAID', '2026-09-19T09:50:12.216Z'::TIMESTAMP(3), '2026-09-19T09:50:12.216Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Payment" ("id", "orderId", "clientId", "invoiceAmount", "amountReceived", "pendingBalance", "paymentDate", "paymentMethod", "transactionRef", "notes", "status", "createdAt", "updatedAt")
VALUES ('cmu87i48p00182ghtjxzbcscf', 'cmu87i48b000o2ghtwybdhh6z', 'cmu87i485000i2ghtfxfs3do8', 1416, 700, 716, '2026-09-19T09:50:12.217Z'::TIMESTAMP(3), 'Stripe', 'ch_3Nva102938', '50% upfront deposit received. Remaining balance due on final delivery.', 'PARTIALLY_PAID', '2026-09-19T09:50:12.217Z'::TIMESTAMP(3), '2026-09-19T09:50:12.217Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "TicketResponse" (1 records)
-- -------------------------------------------------------------------------
INSERT INTO "TicketResponse" ("id", "ticketId", "authorId", "authorName", "authorRole", "message", "createdAt")
VALUES ('cmu87i48y001m2ght78fl2x7k', 'cmu87i48w001k2ghtlqm55qxu', 'cmu87i47o00012ghtj4bhtj0q', 'Elena Rostova (Admin)', 'ADMIN', 'Hello Sophia! Absolutely, Alex (our lead editor) will render the 4:5 and 16:9 cuts alongside the final 9:16 master today.', '2026-09-19T09:50:12.226Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "ScriptComment" (1 records)
-- -------------------------------------------------------------------------
INSERT INTO "ScriptComment" ("id", "scriptId", "authorId", "authorRole", "commentText", "createdAt")
VALUES ('cmu87i48g000w2ghtgcj4mu0a', 'cmu87i48c000q2ghthayg3dyo', 'cmu87i47w00062ghtmcmirudr', 'CLIENT', 'Hook looks punchy! Approved for shoot.', '2026-09-19T09:50:12.209Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Shoot" (1 records)
-- -------------------------------------------------------------------------
INSERT INTO "Shoot" ("id", "clientId", "orderId", "creatorId", "shootManagerId", "cameramanId", "shootingAssistantId", "shootDate", "shootTime", "location", "approvedScriptIds", "specialNotes", "status", "preShootChecklist", "postShootVerification", "createdAt", "updatedAt")
VALUES ('cmu87i48i000y2ghty05r76jc', 'cmu87i484000g2ghtsvscxuys', 'cmu87i48a000m2ght8z1bzw62', 'cmu87i487000j2ghtvz8q2co6', 'cmu87i47u00042ght8cobz2n1', NULL, NULL, '2026-09-22T09:50:12.209Z'::TIMESTAMP(3), '11:00 AM - 3:00 PM', 'Studio 4A, Bandra West, Mumbai', '["cmu87i48c000q2ghthayg3dyo","cmu87i48e000s2ght4sb5su0r"]', 'Lighting must emphasize glass-skin glow. Bring 2 unopened product units for unboxing b-roll.', 'CONFIRMED', '{"scriptApproval":true,"creatorConfirmation":true,"locationPermissions":true,"clientProductReceipt":true,"teamBriefing":true}', '{"footageUploaded":true,"rawFileIntegrity":true,"reshootFlag":false}', '2026-09-19T09:50:12.210Z'::TIMESTAMP(3), '2026-09-19T09:50:12.210Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "Video" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "Video" ("id", "clientId", "orderId", "scriptId", "creatorId", "shootId", "assignedEditorId", "deadline", "rawFootageUrl", "editDraftUrl", "thumbnail", "finalDeliveryUrl", "revisionCount", "status", "finalApprovedAt", "deliveredAt", "createdAt", "updatedAt")
VALUES ('cmu87i48j00102ghtvq93nutv', 'cmu87i484000g2ghtsvscxuys', 'cmu87i48a000m2ght8z1bzw62', 'cmu87i48c000q2ghthayg3dyo', 'cmu87i487000j2ghtvz8q2co6', 'cmu87i48i000y2ghty05r76jc', 'cmu87i47v00052ghtzqqhnimf', '2025-02-20T00:00:00.000Z'::TIMESTAMP(3), 'https://drive.google.com/drive/folders/lumina-raw-v1', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60', NULL, 1, 'CLIENT_REVIEW', NULL, NULL, '2026-09-19T09:50:12.212Z'::TIMESTAMP(3), '2026-09-19T18:00:42.575Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Video" ("id", "clientId", "orderId", "scriptId", "creatorId", "shootId", "assignedEditorId", "deadline", "rawFootageUrl", "editDraftUrl", "thumbnail", "finalDeliveryUrl", "revisionCount", "status", "finalApprovedAt", "deliveredAt", "createdAt", "updatedAt")
VALUES ('cmu87i48l00122ghtsn4avmrl', 'cmu87i484000g2ghtsvscxuys', 'cmu87i48a000m2ght8z1bzw62', 'cmu87i48e000s2ght4sb5su0r', 'cmu87i487000j2ghtvz8q2co6', 'cmu87i48i000y2ghty05r76jc', 'cmu87i47v00052ghtzqqhnimf', NULL, 'https://drive.google.com/drive/folders/lumina-raw-v2', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', NULL, 'https://drive.google.com/drive/folders/lumina-final-v2', 0, 'FINAL_APPROVED', '2025-02-14T00:00:00.000Z'::TIMESTAMP(3), NULL, '2026-09-19T09:50:12.213Z'::TIMESTAMP(3), '2026-09-19T09:50:12.213Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "VideoFeedback" (1 records)
-- -------------------------------------------------------------------------
INSERT INTO "VideoFeedback" ("id", "videoId", "authorId", "authorName", "timestampCode", "feedbackText", "revisionNumber", "createdAt")
VALUES ('cmu87i48m00142ghtuo1nk85o', 'cmu87i48j00102ghtvq93nutv', 'cmu87i47w00062ghtmcmirudr', 'Sophia Carter (Client)', '00:14', 'Please make the serum dropper close-up 1 second longer and brighten the contrast.', 1, '2026-09-19T09:50:12.215Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------
-- Table: "CreatorPayout" (2 records)
-- -------------------------------------------------------------------------
INSERT INTO "CreatorPayout" ("id", "creatorId", "orderId", "videoId", "videoCount", "contractedRate", "totalPayout", "paymentDate", "transactionRef", "status", "createdAt", "updatedAt")
VALUES ('cmu87i48s001e2ghtuqvvqtlb', 'cmu87i487000j2ghtvz8q2co6', 'cmu87i48a000m2ght8z1bzw62', 'cmu87i48l00122ghtsn4avmrl', 1, 250, 250, '2026-09-19T09:50:12.220Z'::TIMESTAMP(3), 'UPI-PAY-987123', 'APPROVED', '2026-09-19T09:50:12.221Z'::TIMESTAMP(3), '2026-09-19T09:50:12.221Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CreatorPayout" ("id", "creatorId", "orderId", "videoId", "videoCount", "contractedRate", "totalPayout", "paymentDate", "transactionRef", "status", "createdAt", "updatedAt")
VALUES ('cmu8p0wtr00012gu93ez78g5v', 'cmu87i487000j2ghtvz8q2co6', 'cmu87i48a000m2ght8z1bzw62', 'cmu87i48j00102ghtvq93nutv', 1, 250, 250, NULL, NULL, 'APPROVED', '2026-09-19T18:00:42.544Z'::TIMESTAMP(3), '2026-09-19T18:00:42.544Z'::TIMESTAMP(3))
ON CONFLICT ("id") DO NOTHING;

COMMIT;

-- End of migration: 40 total records safely staged for PostgreSQL.
