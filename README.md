<div align="center">

# 🏦 ZORVYN FINANCE BACKEND

**Enterprise-Grade Financial Analytics API**

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

A production-hardened RESTful API for financial record management and real-time dashboard analytics, built with strict ACID compliance, role-based access control, and a Redis cache-aside layer for sub-millisecond aggregation responses.

</div>

---

## System Architecture

![System Architecture](./docs/architecture.png)

## Entity Relationship Diagram

![Entity Relationship Diagram](./docs/erd.png)

---

## Table of Contents

- [Key Features](#key-features)
- [Security & Hardening](#security--hardening)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [API Reference](#api-reference)
- [Architectural Decisions](#architectural-decisions)
- [Testing](#testing)
- [License](#license)

---

## Key Features

| Feature | Implementation |
|---|---|
| **JWT Authentication** | Stateless tokens with configurable expiry via `jsonwebtoken` |
| **Role-Based Access Control** | Three-tier RBAC — `Viewer`, `Analyst`, `Admin` — enforced at the middleware layer |
| **ACID-Compliant Financials** | `Decimal(15,2)` precision via PostgreSQL; zero floating-point drift |
| **DB-Level Aggregations** | `SUM`, `GROUP BY` pushed to PostgreSQL — no application-layer math |
| **Redis Cache-Aside** | Dashboard analytics cached with 1-hour TTL; event-driven invalidation on writes |
| **Soft Deletes** | Financial records are never destroyed — `deletedAt` timestamp preserves audit trail |
| **Zod Validation** | Runtime schema enforcement on all inbound payloads with type-safe error messages |
| **Global Error Handling** | Centralized error middleware with Prisma/Zod-aware formatters; zero stack trace leaks in production |
| **Idempotent Seeding** | `upsert`-based seed script safe to re-run without data corruption |
| **Dockerized Stack** | Multi-stage `Dockerfile` + `docker-compose.yml` — full stack (App + Postgres + Redis) in one command |

---

## Security & Hardening

```
┌─────────────────────────────────────────────────────────────┐
│  REQUEST                                                    │
│  ──► Helmet (Security Headers)                              │
│  ──► CORS (Cross-Origin Policy)                             │
│  ──► Compression (gzip)                                     │
│  ──► Morgan (Request Logging)                               │
│  ──► express.json (Body Parsing)                            │
│  ──► Rate Limiter (100 req / 15 min — global)               │
│  ──► Auth Limiter (5 req / 15 min — login endpoint)         │
│  ──► JWT Authentication                                     │
│  ──► RBAC Authorization                                     │
│  ──► Controller ──► Service ──► Prisma ──► PostgreSQL       │
│  ◄── Global Error Handler (4-arg signature, registered last)│
└─────────────────────────────────────────────────────────────┘
```

| Layer | Package | Purpose |
|---|---|---|
| **Security Headers** | `helmet@8` | Sets `X-Content-Type-Options`, `Strict-Transport-Security`, removes `X-Powered-By`, and 11+ additional headers |
| **Rate Limiting** | `express-rate-limit@8` | Global: 100 req/15min per IP. Auth: 5 req/15min per IP (brute-force protection) |
| **Payload Compression** | `compression@1.8` | gzip/deflate on all responses above threshold |
| **Request Logging** | `morgan@1.10` | `combined` format in production, `dev` format locally |
| **Input Validation** | `zod@4` | Runtime schema validation with strict type coercion |
| **Password Security** | `bcryptjs` | 12-round salted hashing; constant-time comparison |

---

## Tech Stack

| Concern | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22+ |
| Framework | Express | 5.x |
| Language | TypeScript | 6.x |
| ORM | Prisma | 7.x |
| Database | PostgreSQL | 17 |
| Cache | Redis | 7+ |
| Validation | Zod | 4.x |
| Auth | jsonwebtoken + bcryptjs | — |
| Containerization | Docker + Compose | — |

---

## Project Structure

```
zorvyn-finance-backend/
├── prisma/
│   ├── schema.prisma          # Data model — Enums, Decimal types, indexes
│   ├── migrations/            # Version-controlled migration history
│   └── seed.ts                # Idempotent seed: 3 users, 10 financial records
├── src/
│   ├── app.ts                 # Express app — middleware pipeline & route mounting
│   ├── server.ts              # HTTP server entry point
│   ├── config/
│   │   └── env.ts             # Zod-validated environment variables
│   ├── generated/
│   │   └── prisma/            # Auto-generated Prisma client
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton (pg driver adapter)
│   │   └── redis.ts           # Redis singleton (lazy connect, graceful fallback)
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification + RBAC authorization
│   │   ├── error.middleware.ts # Global error handler (Zod, Prisma, AppError)
│   │   ├── rateLimiter.ts     # API + Auth rate limiters
│   │   └── index.ts           # Barrel export
│   ├── modules/
│   │   ├── auth/              # Login controller, service, routes, validation
│   │   ├── records/           # CRUD controller, service, routes, validation
│   │   ├── dashboard/         # Aggregation controller, service, routes
│   │   └── users/             # User-related utilities
│   ├── types/                 # Shared TypeScript interfaces
│   └── utils/
│       ├── catchAsync.ts      # Async controller wrapper → next(err)
│       └── response.ts        # Standardized JSON response helpers
├── docs/
│   ├── architecture.png       # System architecture diagram
│   └── erd.png                # Entity relationship diagram
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Full stack: App + PostgreSQL + Redis
├── .dockerignore              # Docker build context exclusions
├── .env.example               # Environment variable template
├── prisma.config.ts           # Prisma datasource configuration
├── package.json
├── tsconfig.json
└── jest.config.ts
```

---

## Setup & Installation

### Prerequisites

- **Docker** & **Docker Compose** (recommended — runs everything)
- **Node.js** ≥ 22 & **npm** ≥ 10 (only for local development without Docker)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/zorvyn-finance-backend.git
cd zorvyn-finance-backend
npm install
```

### 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/zorvyn_finance` |
| `JWT_SECRET` | Signing key (min 16 chars) | `change-this-to-a-256-bit-secret` |
| `JWT_EXPIRES_IN` | Token expiry duration | `24h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment flag | `development` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

### 3. Quick Start — Docker Compose (Recommended)

Spin up the entire stack (App + PostgreSQL + Redis) with a single command:

```bash
docker compose up -d
```

This will:
- Start PostgreSQL 17 and Redis 7 with health checks
- Build the application via a multi-stage Dockerfile
- Run Prisma migrations automatically on startup
- Expose the API on `http://localhost:3000`

```bash
# Verify
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }

# Seed the database
docker compose exec app npx tsx prisma/seed.ts

# View logs
docker compose logs -f app

# Tear down (including volumes)
docker compose down -v
```

### 3b. Manual Setup (Without Docker)

If you prefer running locally without Docker, start PostgreSQL and Redis yourself, then:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database (3 users + 10 financial records)
npm run db:seed
```

### 4. Start the Server (Local Dev)

```bash
# Development (hot-reload via tsx)
npm run dev

# Production
npm run build
npm start
```

The server starts at `http://localhost:3000`. Verify with:

```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }
```

**Seed Credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@zorvyn.com` | `Admin@1234` |
| Analyst | `analyst@zorvyn.com` | `Analyst@1234` |
| Viewer | `viewer@zorvyn.com` | `Viewer@1234` |

---

## API Reference

All responses follow a standardized envelope:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "error": null | "Error message"
}
```

### Authentication

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | None | 5 req / 15 min | Authenticate and receive a JWT |

**Request Body:**
```json
{ "email": "admin@zorvyn.com", "password": "Admin@1234" }
```

**Response:**
```json
{ "success": true, "data": { "token": "eyJhbGci..." }, "error": null }
```

### Financial Records

> All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/records` | Admin, Analyst | List records (paginated, filterable) |
| `GET` | `/api/records/:id` | Admin, Analyst | Get a single record by ID |
| `POST` | `/api/records` | Admin | Create a new financial record |
| `PUT` | `/api/records/:id` | Admin | Update an existing record |
| `DELETE` | `/api/records/:id` | Admin | Soft-delete a record (`deletedAt` timestamp) |

**Query Parameters (GET /api/records):**

| Param | Type | Description |
|---|---|---|
| `type` | `income \| expense` | Filter by record type |
| `category` | `string` | Filter by category |
| `startDate` | `YYYY-MM-DD` | Filter records on or after this date |
| `endDate` | `YYYY-MM-DD` | Filter records on or before this date |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Records per page (default: 20) |

### Dashboard Analytics

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Admin, Analyst, Viewer | Aggregated financial metrics |

**Response Shape:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 705000,
    "totalExpenses": 144001.5,
    "netBalance": 560998.5,
    "categoryBreakdown": [
      { "category": "Client Payment", "total": 335000 }
    ],
    "recentActivity": [ ... ]
  },
  "error": null
}
```

### Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Returns `{ status: "ok" }` with timestamp |

---

## Architectural Decisions

### PostgreSQL over NoSQL

Money is relational. Transactions belong to users, amounts need exact precision, aggregations must be deterministic. Picking a document store for this would be fighting the data model.

 `Decimal(15,2)` at the column level — no floating-point drift, ever. JS `Number` is IEEE 754; it *will* round your sums wrong.
 `Role`, `UserStatus`, `RecordType` are Postgres-native enums. The DB rejects bad state before your code even runs.
 FK constraints + `ON DELETE CASCADE` = no orphaned records. Mongo can't structurally guarantee this.
 ACID on every write. Partial inserts don't exist here.

### DB-Level Aggregations

All dashboard math (`SUM`, `GROUP BY`) runs inside Postgres, not in Node.js.

 Postgres has a query planner, indexes, and parallel workers built for this. Pulling 10k rows into V8 to `reduce()` them is slow and memory-wasteful.
 Decimal arithmetic stays in the DB — amounts never touch JS `Number`, so rounding errors are structurally eliminated.
 This scales with data volume without adding load to the single-threaded event loop.

### Redis Cache-Aside

Dashboard hits multiple aggregation queries per request. Without caching, every page load runs `SUM` + `GROUP BY` on the full dataset.

- **How it works**: First request → query Postgres → cache result in Redis (1h TTL) → return. Subsequent reads hit Redis directly.
- **Invalidation**: Any write (create/update/delete) on `FinancialRecord` calls `redis.del()` on the cache key. Next read gets fresh data.
- **Fallback**: Redis uses lazy connection. If it's down, the app skips cache and queries Postgres directly — no crash, no downtime.
- **Why not write-through?** Reads >> writes for dashboard data. Pre-computing on every mutation wastes cycles for data nobody's looking at yet.

---

## Testing

Run the integration test suite:

```bash
npm test
```

Tests cover:
- **Auth**: Login validation, JWT issuance, invalid credentials handling
- **RBAC**: Role-based endpoint access enforcement
- **Records CRUD**: Create, read, update, soft-delete lifecycle
- **Dashboard**: Aggregation correctness, cache behavior
- **Error Handling**: Zod validation errors, Prisma constraint errors, 404 routing

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot-reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run Jest integration tests |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:migrate:deploy` | Run Prisma migrations (production) |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:generate` | Regenerate Prisma client |
| `docker compose up -d` | Start full stack (App + PostgreSQL + Redis) |
| `docker compose down -v` | Stop stack and destroy volumes |

---

## License

ISC

---

<div align="center">

**Built with precision for the Zorvyn engineering team.**

*PostgreSQL for correctness. Redis for speed. Express for control.*

</div>
