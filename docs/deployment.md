# LEADYFY OS — Production Deployment Guide

## Overview

LEADYFY OS is built with Next.js 15 App Router, Prisma ORM, and Tailwind CSS. It is fully deployable to any Node.js container environment, VPS (Ubuntu/Debian), or cloud platform (Vercel, AWS ECS, Railway, Fly.io).

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL database >= 15.0
- S3-compatible cloud storage bucket (AWS S3, Cloudflare R2, or Google Cloud Storage)

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
