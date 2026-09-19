# LEADYFY OS — Database Backup & Disaster Recovery Guide

## Backup Strategy

LEADYFY OS stores critical operational records, financial transactions, and immutable audit trails. A strict 3-2-1 backup strategy is recommended:
- 3 copies of data
- 2 different storage media
- 1 off-site cloud location

---

## 1. Automated PostgreSQL Daily Backup Script

Save as `/usr/local/bin/backup-leadyfy.sh`:

```bash
#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/leadyfy"
DB_NAME="leadyfy_os"
DB_USER="postgres"
BACKUP_FILE="${BACKUP_DIR}/leadyfy_backup_${TIMESTAMP}.sql.gz"

mkdir -p ${BACKUP_DIR}

# Dump and compress database
pg_dump -U ${DB_USER} -d ${DB_NAME} -F p | gzip > ${BACKUP_FILE}

# Retain backups for 30 days, remove older
find ${BACKUP_DIR} -type f -name "leadyfy_backup_*.sql.gz" -mtime +30 -delete

echo "Backup successful: ${BACKUP_FILE}"
```

Make executable:
```bash
chmod +x /usr/local/bin/backup-leadyfy.sh
```

Add cron schedule to run daily at 2:00 AM:
```cron
0 2 * * * /usr/local/bin/backup-leadyfy.sh >> /var/log/leadyfy-backup.log 2>&1
```

---

## 2. Restore Procedure

To restore from a backup file in disaster recovery:

1. Stop application server:
   ```bash
   pm2 stop leadyfy-os
   ```

2. Drop existing database and recreate clean target:
   ```bash
   dropdb -U postgres leadyfy_os
   createdb -U postgres leadyfy_os
   ```

3. Restore from compressed SQL dump:
   ```bash
   gunzip -c /var/backups/leadyfy/leadyfy_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U postgres -d leadyfy_os
   ```

4. Restart application server:
   ```bash
   pm2 start leadyfy-os
   ```

5. Verify database records and audit logs via `/dashboard/audit-logs`.
