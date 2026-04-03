<div align="center">

# 🏦 ZORVYN FINANCE BACKEND

**Enterprise-Grade Financial Analytics API**

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

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
├── .env.example               # Environment variable template
├── package.json
├── tsconfig.json
└── jest.config.ts
```

---

## Setup & Installation

### Prerequisites

- **Node.js** ≥ 22
- **Docker** (for PostgreSQL & Redis) or local installations
- **npm** ≥ 10

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

### 3. Start Infrastructure (Docker)

```bash
# PostgreSQL
docker run -d \
  --name zorvyn-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=zorvyn_finance \
  -p 5432:5432 \
  postgres:17-alpine

# Redis
docker run -d \
  --name zorvyn-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database (3 users + 10 financial records)
npm run db:seed
```

**Seed Credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@zorvyn.com` | `Admin@1234` |
| Analyst | `analyst@zorvyn.com` | `Analyst@1234` |
| Viewer | `viewer@zorvyn.com` | `Viewer@1234` |

### 5. Start the Server

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
    "totalIncome": "705000.00",
    "totalExpenses": "144001.50",
    "netBalance": "560998.50",
    "categoryBreakdown": [
      { "category": "Client Payment", "type": "income", "_sum": { "amount": "335000.00" } }
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

### Why PostgreSQL over NoSQL?

Financial systems are **relational by nature**. Every transaction belongs to a user, every amount must maintain precision, and every aggregation must be deterministic.

- **ACID Transactions**: PostgreSQL guarantees atomicity on every write — partial inserts and phantom reads are structurally impossible.
- **Decimal Precision**: The `Decimal(15,2)` column type enforces exact two-decimal-place arithmetic at the storage engine level. MongoDB's `NumberDecimal` (Decimal128) is technically capable but lacks ecosystem-wide ORM support and introduces serialization complexity.
- **Enum Enforcement**: `Role`, `UserStatus`, and `RecordType` are PostgreSQL-native enums — the database *itself* rejects invalid state, not just application code.
- **Relational Integrity**: Foreign key constraints with `ON DELETE CASCADE` guarantee referential consistency. In a document store, orphaned sub-documents are a class of bug that simply doesn't exist here.

### Why DB-Level Aggregations?

Dashboard analytics use `SUM`, `GROUP BY`, and raw Prisma aggregation APIs instead of fetching rows and computing in Node.js:

- **Performance**: PostgreSQL's query planner optimizes aggregation over indexed columns. Pulling 10,000 records into V8 and reducing them in JavaScript is orders of magnitude slower and memory-intensive.
- **Correctness**: `Decimal` arithmetic in PostgreSQL is exact. JavaScript's `Number` type is IEEE 754 double-precision — it **will** introduce rounding errors on financial sums. By never deserializing amounts into `Number`, we eliminate this class of bug entirely.
- **Scalability**: As record volume grows, the aggregation cost remains on the database (which has indexing, query caching, and parallel workers) rather than on the single-threaded Node.js event loop.

### Why Redis Cache-Aside?

The dashboard endpoint performs multiple aggregation queries per request. Without caching, every page load hammers PostgreSQL with `SUM` + `GROUP BY` across the entire dataset.

- **Pattern**: Cache-Aside (Lazy Population). On the first request, the service queries PostgreSQL, caches the serialized result in Redis with a 1-hour TTL, and returns it. Subsequent requests are served directly from Redis.
- **Invalidation**: Any mutation on `FinancialRecord` (create, update, soft-delete) triggers explicit cache eviction via `redis.del()`. This ensures the next dashboard read fetches fresh aggregations.
- **Graceful Degradation**: The Redis client uses lazy connection with error-swallowing handlers. If Redis is unavailable, the application falls back to direct PostgreSQL queries without crashing.
- **Why not Write-Through?** Dashboard aggregations are read-heavy, write-infrequent. Pre-computing on every write would waste resources. Cache-aside defers computation until a reader actually needs it.

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

---

## License

ISC

---

<div align="center">

**Built with precision for the Zorvyn engineering team.**

*PostgreSQL for correctness. Redis for speed. Express for control.*

</div>
