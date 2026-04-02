// ─────────────────────────────────────────────────────────
// Dashboard Module — Service Layer
// All aggregation is pushed to PostgreSQL via Prisma's
// aggregate / groupBy — zero in-memory computation.
// ─────────────────────────────────────────────────────────

import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/index.js";

// ─── Types ─────────────────────────────────────────────

interface CategoryBreakdownItem {
  category: string;
  total: number;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categoryBreakdown: CategoryBreakdownItem[];
  recentActivity: {
    id: number;
    amount: number;
    type: string;
    category: string;
    date: Date;
    notes: string | null;
    createdBy: number;
    createdAt: Date;
  }[];
}

// ─── Helpers ───────────────────────────────────────────

/**
 * Safely convert a Prisma Decimal (or null) to a JS number.
 * Returns 0 when the aggregation yields null (e.g. no rows).
 */
function decimalToNumber(value: Prisma.Decimal | null): number {
  if (value === null) return 0;
  return value.toNumber();
}

// ─── Main Query ────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  // Run all independent queries in parallel for best latency.
  const [incomeAgg, expenseAgg, categoryGroups, recentRecords] =
    await Promise.all([
      // 1. Total income — DB-level SUM
      prisma.financialRecord.aggregate({
        where: { type: "income", deletedAt: null },
        _sum: { amount: true },
      }),

      // 2. Total expenses — DB-level SUM
      prisma.financialRecord.aggregate({
        where: { type: "expense", deletedAt: null },
        _sum: { amount: true },
      }),

      // 3. Category breakdown — DB-level GROUP BY + SUM
      prisma.financialRecord.groupBy({
        by: ["category"],
        where: { deletedAt: null },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),

      // 4. Recent activity — last 5 records by creation time
      prisma.financialRecord.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const totalIncome = decimalToNumber(incomeAgg._sum.amount);
  const totalExpenses = decimalToNumber(expenseAgg._sum.amount);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,

    categoryBreakdown: categoryGroups.map((group) => ({
      category: group.category,
      total: decimalToNumber(group._sum.amount),
    })),

    recentActivity: recentRecords.map((record) => ({
      id: record.id,
      amount: record.amount.toNumber(),
      type: record.type,
      category: record.category,
      date: record.date,
      notes: record.notes,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
    })),
  };
}
