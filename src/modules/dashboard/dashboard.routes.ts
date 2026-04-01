// ─────────────────────────────────────────────────────────
// Dashboard Module — Route Definitions
// All roles (Viewer, Analyst, Admin) can access summaries.
// ─────────────────────────────────────────────────────────

import { Router } from "express";
import { authenticate, authorize } from "../../middleware/index.js";
import { getSummaryController } from "./dashboard.controller.js";

const dashboardRouter = Router();

// ─── Apply authentication to ALL dashboard routes ──────
dashboardRouter.use(authenticate);

// ─── Read Routes — All Authenticated Roles ─────────────

/**
 * GET /api/dashboard/summary
 * Returns aggregated financial metrics:
 *   totalIncome, totalExpenses, netBalance,
 *   categoryBreakdown, recentActivity
 */
dashboardRouter.get(
  "/summary",
  authorize(["Admin", "Analyst", "Viewer"]),
  getSummaryController
);

export { dashboardRouter };
