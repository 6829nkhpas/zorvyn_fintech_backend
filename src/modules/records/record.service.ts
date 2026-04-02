// ─────────────────────────────────────────────────────────
// Records Module — Service Layer
// Pure business logic: no HTTP concepts (req/res).
// Mutations invalidate the Redis dashboard cache so
// analytics never reflect stale financial data.
// ─────────────────────────────────────────────────────────

import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/index.js";
import { redis, isRedisReady } from "../../lib/redis.js";
import type { RecordQueryInput, CreateRecordInput } from "./record.validation.js";

// ─── Cache key (must match dashboard.service.ts) ───────

const DASHBOARD_CACHE_KEY = "dashboard:summary";

// ─── Helpers ───────────────────────────────────────────

/**
 * Delete the dashboard summary cache so the next request
 * fetches fresh data from the database.
 * Errors are logged but never bubble up — cache invalidation
 * must not break a successful DB mutation.
 */
async function invalidateDashboardCache(): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await redis.del(DASHBOARD_CACHE_KEY);
  } catch (err) {
    console.error("[Redis] Cache invalidation error:", (err as Error).message);
  }
}

// ─── Error Class ───────────────────────────────────────

export class RecordError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "RecordError";
    this.statusCode = statusCode;
  }
}

// ─── Create ────────────────────────────────────────────

export async function createRecord(
  data: CreateRecordInput,
  userId: number
) {
  const record = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(data.amount),
      type: data.type,
      category: data.category,
      date: data.date,
      notes: data.notes ?? null,
      createdBy: userId,
    },
  });

  await invalidateDashboardCache();

  return record;
}

// ─── Find All (with filtering & pagination) ────────────

export async function findAllRecords(query: RecordQueryInput) {
  const { type, category, startDate, endDate, page, limit } = query;

  // Build dynamic where clause — only apply filters that exist
  const where: Prisma.FinancialRecordWhereInput = { deletedAt: null };

  if (type) {
    where.type = type;
  }

  if (category) {
    where.category = { contains: category, mode: "insensitive" };
  }

  if (startDate || endDate) {
    where.date = {};

    if (startDate) {
      where.date.gte = new Date(startDate);
    }

    if (endDate) {
      // Include the entire end date day
      where.date.lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Find One ──────────────────────────────────────────

export async function findRecordById(id: number) {
  const record = await prisma.financialRecord.findFirst({
    where: { id, deletedAt: null },
  });

  if (!record) {
    throw new RecordError("Financial record not found", 404);
  }

  return record;
}

// ─── Update ────────────────────────────────────────────

export async function updateRecord(
  id: number,
  data: Partial<CreateRecordInput>
) {
  // Verify existence first
  await findRecordById(id);

  const updateData: Prisma.FinancialRecordUpdateInput = {};

  if (data.amount !== undefined) {
    updateData.amount = new Prisma.Decimal(data.amount);
  }
  if (data.type !== undefined) {
    updateData.type = data.type;
  }
  if (data.category !== undefined) {
    updateData.category = data.category;
  }
  if (data.date !== undefined) {
    updateData.date = data.date;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes ?? null;
  }

  const record = await prisma.financialRecord.update({
    where: { id },
    data: updateData,
  });

  await invalidateDashboardCache();

  return record;
}

// ─── Delete ────────────────────────────────────────────

export async function deleteRecord(id: number) {
  // Verify existence (and ensure it hasn't been soft-deleted already)
  await findRecordById(id);

  await prisma.financialRecord.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await invalidateDashboardCache();
}
