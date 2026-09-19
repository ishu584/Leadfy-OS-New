const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const outputPath = path.join(__dirname, "..", "prisma", "postgres_seed_data.sql");

const db = new DatabaseSync(dbPath);

const tablesInOrder = [
  "User",
  "Creator",
  "ActivityLog",
  "Employee",
  "Client",
  "CreatorAvailability",
  "Expense",
  "Task",
  "Notification",
  "Order",
  "SupportTicket",
  "Asset",
  "Script",
  "Payment",
  "TicketResponse",
  "ScriptComment",
  "Shoot",
  "Video",
  "VideoFeedback",
  "CreatorPayout",
];

function formatSqlValue(val, colType) {
  if (val === null || val === undefined) return "NULL";
  const typeUpper = (colType || "").toUpperCase();

  if (typeUpper.includes("BOOL")) {
    return val ? "TRUE" : "FALSE";
  }

  if (typeUpper.includes("DATE") || typeUpper.includes("TIME")) {
    const d = typeof val === "number" ? new Date(val) : new Date(val);
    if (isNaN(d.getTime())) return "NULL";
    return `'${d.toISOString()}'::TIMESTAMP(3)`;
  }

  if (typeUpper.includes("INT") || typeUpper === "REAL" || typeUpper.includes("FLOAT") || typeUpper.includes("DOUBLE")) {
    return String(val);
  }

  // Text/string
  const escaped = String(val).replace(/'/g, "''");
  return `'${escaped}'`;
}

let sql = `-- =========================================================================\n`;
sql += `-- LEADYFY OS - Production PostgreSQL Initial Data Migration from dev.db\n`;
sql += `-- Generated: ${new Date().toISOString()}\n`;
sql += `-- Preserves all original CUID IDs, bcrypt password hashes, and relations\n`;
sql += `-- =========================================================================\n\n`;
sql += `BEGIN;\n\n`;

let grandTotal = 0;

for (const tableName of tablesInOrder) {
  const colInfo = db.prepare(`PRAGMA table_info("${tableName}")`).all();
  const colMap = new Map();
  colInfo.forEach((c) => colMap.set(c.name, c.type));

  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  sql += `-- -------------------------------------------------------------------------\n`;
  sql += `-- Table: "${tableName}" (${rows.length} records)\n`;
  sql += `-- -------------------------------------------------------------------------\n`;

  if (rows.length === 0) {
    sql += `-- (No records in dev.db)\n\n`;
    continue;
  }

  for (const row of rows) {
    const colNames = Object.keys(row);
    const quotedCols = colNames.map((c) => `"${c}"`).join(", ");
    const vals = colNames.map((c) => formatSqlValue(row[c], colMap.get(c))).join(", ");

    sql += `INSERT INTO "${tableName}" (${quotedCols})\n`;
    sql += `VALUES (${vals})\n`;
    sql += `ON CONFLICT ("id") DO NOTHING;\n\n`;
    grandTotal++;
  }
}

sql += `COMMIT;\n\n`;
sql += `-- End of migration: ${grandTotal} total records safely staged for PostgreSQL.\n`;

fs.writeFileSync(outputPath, sql, "utf-8");
console.log(`Generated ${outputPath} with ${grandTotal} records across ${tablesInOrder.length} tables.`);
