# LEADYFY OS — Production Deployment Guide

## Overview

LEADYFY OS is built with Next.js 15 App Router, Prisma ORM, and Tailwind CSS. It is fully deployable to any Node.js container environment, VPS (Ubuntu/Debian), or cloud platform (Vercel, AWS ECS, Railway, Fly.io).

## Vercel Production Deployment

### 1. Database Setup (Managed PostgreSQL)
1. Provision a PostgreSQL instance using **Neon** (recommended for Vercel) or **Supabase**.
2. Retrieve your PostgreSQL connection string:
   - For Neon: `postgresql://[user]:[password]@[neon-hostname]/neondb?sslmode=require`
   - For Supabase: Use the pooled connection string (port 6543) or direct connection.

### 2. Run Database Migration & Staging
From your local environment or deployment pipeline:
```bash
# 1. Apply PostgreSQL schema migrations:
DATABASE_URL="<YOUR_POSTGRES_CONNECTION_STRING>" npx prisma migrate deploy

# 2. Migrate existing records from dev.db to PostgreSQL:
DATABASE_URL="<YOUR_POSTGRES_CONNECTION_STRING>" npm run db:migrate:data
# (Alternatively, paste prisma/postgres_seed_data.sql into your Neon/Supabase SQL console)
```

### 3. Vercel Project Configuration
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (runs `prisma generate && next build`)
- **Install Command**: `npm install`
- **Node.js Version**: 20.x or 22.x

### 4. Environment Variables on Vercel
Add the following in **Vercel Project Settings → Environment Variables**:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | 32+ character random secret | Generate via `openssl rand -hex 32` |
| `NODE_ENV` | Production environment | `production` |
| `NEXT_PUBLIC_APP_URL` | Your production Vercel domain | `https://your-app.vercel.app` |
| `STORAGE_PROVIDER` | Media storage provider | `local` (or `s3` with AWS keys) |

---

## Deployment Steps (Node / VPS)

1. **Clone repository and install dependencies**:
   ```bash
   git clone <repo-url> leadyfy-os
   cd leadyfy-os
   npm ci
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Set production variables:
   ```env
   NODE_ENV="production"
   PORT=3000
   DATABASE_URL="postgresql://postgres:secure_password@db.example.com:5432/leadyfy_os?schema=public"
   AUTH_SECRET="your-64-character-cryptographically-secure-random-secret"
   NEXT_PUBLIC_APP_URL="https://leadyfy.yourdomain.com"
   STORAGE_PROVIDER="s3"
   AWS_S3_BUCKET="leadyfy-production-assets"
   AWS_ACCESS_KEY_ID="AKIA..."
   AWS_SECRET_ACCESS_KEY="..."
   AWS_REGION="us-east-1"
   ```

3. **Deploy Database Schema**:
   ```bash
   npm run db:migrate
   ```

4. **Build Production Application**:
   ```bash
   npm run build
   ```

5. **Start Production Server with Process Manager (PM2)**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "leadyfy-os" -- start
   pm2 save
   pm2 startup
   ```

6. **Nginx Reverse Proxy & SSL (Certbot)**:
   Configure Nginx reverse proxy to forward traffic on port 80/443 to `http://localhost:3000`.
