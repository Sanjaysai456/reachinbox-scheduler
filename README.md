# ReachInbox Email Scheduler

This repository now contains a complete TypeScript full-stack implementation of the assignment in [readme.txt](/home/the_devils_guy/Programming/study_projects/sanjay/readme.txt): an Express + BullMQ + Redis + PostgreSQL backend and a React + TypeScript dashboard with real Google login.

## Stack

- Backend: Express, TypeScript, Prisma, PostgreSQL, BullMQ, Redis, Nodemailer, Google token verification
- Frontend: React, TypeScript, Vite, React Router, Google OAuth, Papa Parse
- Infra: Docker Compose for Redis and optional local PostgreSQL

## Features Implemented

- Real Google login using Google Identity Services on the frontend and Google ID token verification on the backend
- JWT-backed authenticated dashboard session
- Schedule email batches with subject, body, CSV/text lead upload, start time, delay between emails, and hourly limit
- PostgreSQL persistence for users, campaigns, senders, and individual email jobs
- BullMQ delayed jobs backed by Redis, with startup recovery that rehydrates pending scheduled jobs from the database
- Multiple Ethereal SMTP senders configured through environment variables
- Sender-aware slot reservation in Redis so batches preserve ordering and respect throttling safely across restarts
- Dashboard tabs for scheduled emails and sent/failed emails
- Loading, empty, and error states across the dashboard

## How Scheduling Works

1. The frontend uploads a CSV or text file and extracts recipient email addresses.
2. The backend creates a campaign and individual email records in PostgreSQL.
3. For every email, the backend reserves a concrete send timestamp in Redis using:
   - a per-sender "next available" pointer to enforce minimum spacing between sends
   - a per-sender hourly counter to enforce the hourly limit
4. Each email is added to BullMQ as a delayed job using its reserved timestamp.
5. On server restart, the API process reloads every `SCHEDULED` email from PostgreSQL back into BullMQ by `jobId`, so pending future emails stay intact.
6. The worker sends mail through Ethereal and marks each record as `SENT` or `FAILED`.

## Concurrency, Rate Limiting, And Delay

- Worker concurrency is configurable with `WORKER_CONCURRENCY`.
- Minimum spacing between emails is enforced with a Redis-backed per-sender availability key.
- Hourly throttling is enforced with Redis-backed per-sender hour buckets.
- If a batch would exceed the hourly limit, later emails are pushed into the next available hour window instead of being dropped.
- The API currently clamps user-provided values to backend safety defaults:
  - effective delay = `max(requestedDelay, DEFAULT_DELAY_BETWEEN_EMAILS_MS)`
  - effective hourly limit = `min(requestedHourlyLimit, DEFAULT_HOURLY_LIMIT)`

## Environment Setup

Create these files from the examples:

- `cp .env.example .env`
- `cp backend/.env.example backend/.env`
- `cp frontend/.env.example frontend/.env`

### Root `.env`

- Used only by Docker Compose for optional local PostgreSQL and Redis credentials.

### Backend `.env`

Required keys:

- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `SMTP_SENDERS_JSON`

For Neon:

- Use the pooled Neon connection string in `DATABASE_URL`
- Use the direct Neon connection string in `DIRECT_URL`
- Keep `sslmode=require`
- `DIRECT_URL` is used by Prisma for migrations so schema changes work cleanly against Neon

Generate Ethereal senders with:

```bash
cd backend
npm run ethereal:generate -- 2
```

Paste the JSON output into `SMTP_SENDERS_JSON`.

### Frontend `.env`

- `VITE_API_BASE_URL=http://localhost:8080`
- `VITE_GOOGLE_CLIENT_ID=...`

## Local Run

### 1. Start infrastructure

```bash
docker compose up -d
```

If you are using Neon, you only need Redis from Docker:

```bash
docker compose up -d redis
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Prepare the database

```bash
cd backend
npx prisma migrate dev --name init
```

If you only want a quick schema sync:

```bash
npx prisma db push
```

### 4. Start backend API

```bash
cd backend
npm run dev
```

### 5. Start backend worker

```bash
cd backend
npm run worker:dev
```

### 6. Start frontend

```bash
cd frontend
npm run dev
```

## API Overview

- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/emails/schedule`
- `GET /api/emails/scheduled`
- `GET /api/emails/history`
- `GET /api/emails/summary`
- `GET /api/health`

## Docker Notes

- `docker-compose.yml` starts PostgreSQL and Redis with persistent volumes.
- If you use Neon, Docker Postgres is optional and can be skipped entirely.
- Backend and frontend Dockerfiles are included if you want to containerize the app services too.

## Suggested Demo Flow

1. Log in with Google.
2. Upload a CSV/text file of leads and schedule a batch.
3. Show scheduled rows appearing in the dashboard.
4. Start the worker and show sent rows with Ethereal preview links.
5. Stop and restart the API, then refresh the dashboard to show that future scheduled emails were recovered.
