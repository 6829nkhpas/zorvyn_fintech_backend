<p align="center">
  <strong>ZORVYN FINANCE BACKEND</strong>
</p>

<p align="center">
  A robust, production-grade REST API for financial record management with role-based access control, real-time dashboard analytics, and strict ACID compliance.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Zod-4.x-3E67B1?logo=zod&logoColor=white" alt="Zod" />
</p>

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architectural Decisions](#architectural-decisions)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Seed Data](#seed-data)
- [Error Handling](#error-handling)
- [Assumptions](#assumptions)
- [License](#license)

---

## Project Overview

Zorvyn Finance Backend is a secure, maintainable REST API powering a financial dashboard. It supports:

- **Role-Based Access Control (RBAC)** — Three distinct roles (Admin, Analyst, Viewer) with granular permission enforcement at the route level.
- **Financial Record Management** — Full CRUD operations on income/expense records with pagination, dynamic filtering by type, category, and date range.
- **Dashboard Analytics** — Aggregated metrics (total income, total expenses, net balance, category breakdown, recent activity) computed entirely at the PostgreSQL level for optimal performance.
- **Strict Input Validation** — Every request body and query parameter is validated at the edge using Zod schemas before reaching business logic.
- **Global Error Handling** — Centralized error middleware that formats Zod validation errors, Prisma database errors, and application errors into a consistent response structure without leaking internal stack traces in production.

---

## Architectural Decisions

### Layered Architecture

```
Routes → Controllers → Services → Data Access (Prisma ORM)
```

Each layer has a single responsibility:

| Layer        | Responsibility                                        |
|-------------|-------------------------------------------------------|
| **Routes**      | HTTP method mapping, middleware composition (auth, RBAC) |
| **Controllers** | Request validation, response formatting — no business logic |
| **Services**    | Pure business logic — no HTTP concepts (`req`/`res`)  |
| **Data Access** | Prisma ORM with PostgreSQL driver adapter             |

### Key Design Decisions

1. **DB-Level Aggregations** — Dashboard analytics use Prisma's `aggregate()` and `groupBy()` to push computation to PostgreSQL. Zero in-memory processing ensures consistent performance regardless of dataset size.

2. **Strict RBAC Enforcement** — Authorization is enforced via composable middleware, not at the service layer. Routes declare required roles explicitly, making the permission model auditable at a glance.

3. **Zod at the Edge** — Request bodies and query parameters are validated via Zod schemas _before_ reaching controllers. Invalid input is rejected with descriptive error messages at the HTTP boundary.

4. **`Decimal(15,2)` for Amounts** — Financial amounts use PostgreSQL's `DECIMAL(15,2)` type, ensuring ACID-compliant currency precision. Prisma's `Decimal` type is converted to JS `number` only at the serialization boundary.

5. **`catchAsync` Wrapper** — All async controller methods are wrapped to ensure rejected promises propagate to Express's error middleware via `next()`, preventing silent process crashes.

6. **Global Error Handler** — A centralized middleware formats Zod errors (400), Prisma unique constraint violations (409), missing records (404), and unexpected errors (500) into a consistent JSON structure. In production mode, database stack traces are never exposed.

---

## Tech Stack

| Category       | Technology                          |
|---------------|-------------------------------------|
| Runtime        | Node.js 22+                         |
| Framework      | Express.js 5.x                      |
| Language       | TypeScript 6.x (strict mode)        |
| Database       | PostgreSQL 16+                      |
| ORM            | Prisma 7.x (with `@prisma/adapter-pg`) |
| Validation     | Zod 4.x                             |
| Authentication | JWT (`jsonwebtoken`) + bcrypt        |
| Security       | Helmet, CORS, express-rate-limit    |

---

## Project Structure

```
zorvyn-finance-backend/
├── prisma/
│   ├── migrations/         # Prisma migration history
│   ├── schema.prisma       # Data model (User, FinancialRecord, enums)
│   └── seed.ts             # Database seeding script
├── src/
│   ├── config/
│   │   └── env.ts          # Zod-validated environment variables
│   ├── generated/
│   │   └── prisma/         # Auto-generated Prisma client
│   ├── lib/
│   │   └── prisma.ts       # Singleton PrismaClient with pg driver adapter
│   ├── middleware/
│   │   ├── auth.middleware.ts   # authenticate() + authorize() middleware
│   │   ├── error.middleware.ts  # Global error handler
│   │   └── index.ts            # Barrel export
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── dashboard.service.ts
│   │   └── records/
│   │       ├── record.controller.ts
│   │       ├── record.routes.ts
│   │       ├── record.service.ts
│   │       └── record.validation.ts
│   ├── types/
│   │   ├── express.d.ts    # Express Request augmentation (req.user)
│   │   └── jwt.ts          # AuthTokenPayload interface
│   ├── utils/
│   │   ├── catchAsync.ts   # Async handler wrapper
│   │   └── response.ts     # sendSuccess() / sendError() helpers
│   ├── app.ts              # Express app configuration
│   └── server.ts           # HTTP server entry point
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Setup & Installation

### Prerequisites

- **Node.js** ≥ 22.x
- **PostgreSQL** ≥ 16.x (running and accessible)
- **npm** ≥ 10.x

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/zorvyn-finance-backend.git
cd zorvyn-finance-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable        | Description                             | Default       |
|----------------|-----------------------------------------|---------------|
| `DATABASE_URL`  | PostgreSQL connection string             | _(required)_  |
| `JWT_SECRET`    | Secret key for signing JWTs (≥ 16 chars) | _(required)_  |
| `JWT_EXPIRES_IN`| Token expiration duration                | `24h`         |
| `PORT`          | Server port                              | `3000`        |
| `NODE_ENV`      | Environment (`development` / `production` / `test`) | `development` |

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Seed the Database

```bash
npm run db:seed
```

This creates three test users and ten sample financial records (see [Seed Data](#seed-data)).

### 7. Start the Development Server

```bash
npm run dev
```

The server starts at `http://localhost:3000` with hot-reload via `tsx watch`.

### Production Build

```bash
npm run build
npm start
```

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Response Format

All endpoints return a consistent JSON structure:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "error": "Error message" | null
}
```

### Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

### Auth Endpoints

| Method | Endpoint            | Auth | Roles | Description            |
|--------|---------------------|------|-------|------------------------|
| `POST` | `/api/auth/login`   | ✗    | —     | Authenticate and receive JWT |

<details>
<summary><strong>POST /api/auth/login</strong></summary>

**Body:**
```json
{
  "email": "admin@zorvyn.com",
  "password": "Admin@1234"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "token": "eyJhbGciOiJIUzI1NiIs..." },
  "error": null
}
```
</details>

---

### Financial Records Endpoints

| Method   | Endpoint              | Auth | Roles              | Description                     |
|----------|-----------------------|------|--------------------|---------------------------------|
| `GET`    | `/api/records`        | ✓    | Admin, Analyst     | List records (paginated, filtered) |
| `GET`    | `/api/records/:id`    | ✓    | Admin, Analyst     | Get a single record by ID       |
| `POST`   | `/api/records`        | ✓    | Admin              | Create a new record             |
| `PUT`    | `/api/records/:id`    | ✓    | Admin              | Update an existing record       |
| `DELETE` | `/api/records/:id`    | ✓    | Admin              | Delete a record                 |

<details>
<summary><strong>GET /api/records</strong> — Query Parameters</summary>

| Param       | Type     | Default | Description                          |
|-------------|----------|---------|--------------------------------------|
| `type`      | `string` | —       | Filter by `income` or `expense`      |
| `category`  | `string` | —       | Filter by category (case-insensitive) |
| `startDate` | `string` | —       | ISO date (`YYYY-MM-DD`)              |
| `endDate`   | `string` | —       | ISO date (`YYYY-MM-DD`)              |
| `page`      | `number` | `1`     | Page number                          |
| `limit`     | `number` | `20`    | Records per page (max `100`)         |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "records": [ { "id": 1, "amount": "150000.00", ... } ],
    "pagination": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
  },
  "error": null
}
```
</details>

<details>
<summary><strong>POST /api/records</strong> — Request Body</summary>

```json
{
  "amount": 50000.00,
  "type": "income",
  "category": "Consulting",
  "date": "2026-03-15",
  "notes": "Optional notes"
}
```
</details>

---

### Dashboard Endpoints

| Method | Endpoint                  | Auth | Roles                     | Description                |
|--------|---------------------------|------|---------------------------|----------------------------|
| `GET`  | `/api/dashboard/summary`  | ✓    | Admin, Analyst, Viewer    | Aggregated financial metrics |

<details>
<summary><strong>GET /api/dashboard/summary</strong> — Response</summary>

```json
{
  "success": true,
  "data": {
    "totalIncome": 705000.00,
    "totalExpenses": 146001.50,
    "netBalance": 558998.50,
    "categoryBreakdown": [
      { "category": "Client Payment", "total": 335000.00 },
      { "category": "Product Revenue", "total": 275000.00 }
    ],
    "recentActivity": [
      { "id": 10, "amount": 11350.25, "type": "expense", "category": "Travel", ... }
    ]
  },
  "error": null
}
```
</details>

---

### Health Check

| Method | Endpoint   | Auth | Description          |
|--------|-----------|------|----------------------|
| `GET`  | `/health` | ✗    | Server health status |

---

## Seed Data

The seed script (`npm run db:seed`) creates the following test data:

### Users

| Name          | Email                | Password       | Role    |
|---------------|---------------------|----------------|---------|
| Arjun Mehta   | admin@zorvyn.com    | `Admin@1234`   | Admin   |
| Priya Sharma  | analyst@zorvyn.com  | `Analyst@1234` | Analyst |
| Ravi Kumar    | viewer@zorvyn.com   | `Viewer@1234`  | Viewer  |

### Financial Records

10 sample records spanning income and expense categories including Client Payments, Cloud Infrastructure, Office Supplies, Product Revenue, Marketing, Consulting, Software Licenses, Payroll, and Travel.

---

## Error Handling

The application uses a centralized global error handler that processes all errors into a consistent format:

| Error Type                       | HTTP Status | Example Message                                |
|----------------------------------|-------------|-----------------------------------------------|
| Zod validation failure           | `400`       | `amount: Amount must be positive`             |
| Prisma unique constraint         | `409`       | `A record with this email already exists`     |
| Prisma record not found          | `404`       | `Record not found`                            |
| Prisma foreign key violation     | `400`       | `Invalid reference: related field does not exist` |
| Application error (e.g. AuthError) | varies    | `Invalid email or password`                   |
| Unhandled / unexpected           | `500`       | `Internal server error` (production)          |

> **Security**: In `production` mode, database stack traces and internal error details are never exposed to the client.

---

## Assumptions

1. **Mock Authentication Strategy** — The API uses stateless JWT authentication. There is no registration endpoint; users are created via the seed script. Token refresh and logout are not implemented.

2. **Single-Tenant Model** — All users share the same financial record set. There is no tenant isolation or organization-level scoping.

3. **Viewer Role Restrictions** — Viewers can access the aggregated dashboard summary but cannot access raw financial records (enforced at the route level).

4. **Pagination Limits** — The maximum page size for record listing is capped at `100` records per request. Default is `20`.

5. **Date Handling** — All dates are stored as PostgreSQL `DATE` type and expected in `YYYY-MM-DD` format. Timezone handling is delegated to the database.

6. **No File Uploads** — JSON body size is limited to `1 MB`. The API does not support file attachments or multipart form data.

7. **CORS** — CORS is configured permissively for development. In production, the allowed origins should be restricted.

8. **Rate Limiting** — `express-rate-limit` is available as a dependency but is not configured globally. Rate limiting can be applied per-route as needed.

9. **Prisma Driver Adapter** — Prisma 7 requires an explicit driver adapter (`@prisma/adapter-pg`). A connection pool is managed via the `pg` driver to prevent exhausting database connections during hot-reloads.

---

## License

ISC
