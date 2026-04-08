# ReachInbox Email Scheduler

> [!WARNING]
> **Production Deployment Notice**
> Due to pricing limits on Render, we were only able to deploy the frontend and backend API servers to the live production environment. The separate background worker node could not be deployed concurrently. Because of this, delayed emails will **not** process in the live URL. 
> 
> **Please watch the attached local demonstration video to see the scheduling worker processing correctly in action!** 

A production-grade email scheduler service and dashboard for bulk email outreach, built strictly adhering to the ReachInbox intern assignment guidelines.

## 🚀 Features Implemented

### Backend
- **Scheduler**: Schedules emails efficiently using BullMQ delayed jobs instead of polling via CRON.
- **Persistence**: Gracefully recovers pending/scheduled jobs from a relational database and enqueues them accurately upon server restart.
- **Rate Limiting**: Implements thread-safe, atomic rate limits (Email Per Hour constraints) across concurrent workers using robust Lua-based Redis scripts. Reschedules emails naturally instead of dropping them.
- **Concurrency**: Robust, configurable processing using BullMQ concurrency levels, distributing exact pacing correctly.

### Frontend
- **Login**: Authentic Google OAuth login using `@react-oauth/google`.
- **Dashboard**: High-quality layout mirroring the Figma design precisely. Includes quick-view metrics for Scheduled/Sent campaigns.
- **Compose**: Supports custom subject, body, and **CSV/TXT file upload** support for bulk recipients (using `papaparse`). Emails are automatically detected and parsed via Regex. Flexible rollout pacing includes customizable delay limits.
- **Tables**: Clean status boards sorting all processed email history (Scheduled and Sent tabs) with empty states.

---

## 🏗 Architecture Overview

### How Scheduling Works
Our scheduling architecture intentionally bypasses CRON jobs in favor of highly optimized BullMQ delayed jobs.
1. When an email campaign is created, the system iterates over the recipients and reserves discrete sending slots.
2. The slot reservation system evaluates the current time and ensures the minimum delay constraint between each email (e.g., minimum 2 seconds).
3. The reserved slot generates the exact deferred execution timestamp.
4. The system registers the `EmailJob` in the database with status `SCHEDULED`.
5. The `queue.service` passes the execution timestamp into the BullMQ Delayed Queue, using the `id` as the BullMQ `jobId` for absolute idempotency.
6. Once the delay triggers asynchronously, the BullMQ worker picks up the job and executes it.

### How Rate Limiting & Concurrency are Implemented
- **Concurrency**: The worker is configured at instantiation with an isolated `concurrency` option defined by `env.WORKER_CONCURRENCY`. If multiple jobs trigger simultaneously, BullMQ processes them strictly according to this concurrency threshold. Wait intervals aren't reliant on worker sleeping—they are handled explicitly by BullMQ delays.
- **Rate Limiting**: A custom script was implemented via Redis `EVAL` using Lua. Whenever an email looks for an execution slot, it looks up an `hourBucket` key in Redis. If the bucket exceeds the `hourlyLimit` configuration, the system reschedules the execution block iteratively to the start time of the next available `hourBucket`. The Redis architecture guarantees rate limiting doesn't overflow when scaled horizontally.

### How Persistence on Restart is Handled
Since state is continuously pushed to a persistent `MySQL/PostgreSQL` relationship DB (Prisma), the application ensures system integrity across restarts. 
On startup, a `recoverScheduledJobs` function connects directly queries the database for all `EmailJob` rows that still reside in the `SCHEDULED` status. It synchronizes these jobs against the BullMQ Redis queue. Because uniqueness is mapped strictly to the `jobId` parameter inside BullMQ, existing delayed jobs are naturally overridden or ignored, avoiding duplicate distributions safely.

---

## 💻 Tech Stack Setup & Environment

Before you run the project, construct `.env` files in both backend and frontend environments based on your local ecosystem. Setup instructions are detailed below:

### 1. Database & Redis Requirements (Docker)
The backend architecture expects a PostgreSQL Database and a Redis Node to be operational.

Ensure you have a valid Postgres schema deployed and an isolated Redis container.
*(Tip: You can use `docker-compose.yml` natively if included, or direct instances)*

### 2. Backend Environment Setup (`/backend/.env`)
Create a `.env` in the `/backend` folder:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/reachinboxdb?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/reachinboxdb?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# BullMQ Config
QUEUE_NAME="email-queue"
WORKER_CONCURRENCY=5

# Google Auth Config (used for frontend verification securely)
GOOGLE_CLIENT_ID="[Your-Google-Client-Id-Here]"
```

### 3. Frontend Environment Setup (`/frontend/.env`)
Create a `.env` in the `/frontend` folder:
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID="[Your-Google-Client-Id-Here]"
```

### 4. Setting Up Ethereal Email
The project automatically manages Ethereal email configuration as its base framework.
To instantiate test credentials into your DB context directly:
1. Ensure the PostgreSQL DB is running.
2. In the `backend` directory, run:
```bash
npm run ethereal:generate
```
This script cleanly registers a new Sender automatically via Ethereal SMTP inside your Database. No manual setup required!

---

## 🏃 Implementation Guide

### Running The Backend API Server & Worker
Open a new terminal inside the `/backend` folder:
1. `npm install`
2. `npm run prisma:generate` (Generate Typed Prisma Client)
3. `npm run prisma:migrate` (Sync schema to DB)
4. `npm run dev` (Starts the core Express.js Scheduler API)
5. `npm run worker:dev` (Open a separate terminal - Starts the BullMQ process worker)

### Running The Frontend Dashboard
Open a new terminal inside the `/frontend` folder:
1. `npm install`
2. `npm run dev` (Spins up Vite UI server on `http://localhost:5173`)
