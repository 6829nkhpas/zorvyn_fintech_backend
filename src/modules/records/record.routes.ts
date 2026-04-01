// ─────────────────────────────────────────────────────────
// Records Module — Route Definitions
// All routes require authentication via JWT middleware.
// ─────────────────────────────────────────────────────────

import { Router } from "express";
import { authenticate, authorize } from "../../middleware/index.js";
import {
  createRecordController,
  getAllRecordsController,
  getRecordByIdController,
  updateRecordController,
  deleteRecordController,
} from "./record.controller.js";

const recordRouter = Router();

// ─── Apply authentication to ALL record routes ────────
recordRouter.use(authenticate);

// ─── Read Routes — Admin + Analyst ────────────────────

/**
 * GET /api/records
 * Returns paginated, filterable list of financial records.
 * Query: ?type=income&category=Salary&startDate=2025-01-01&endDate=2025-12-31&page=1&limit=20
 */
recordRouter.get(
  "/",
  authorize(["Admin", "Analyst"]),
  getAllRecordsController
);

/**
 * GET /api/records/:id
 * Returns a single financial record by ID.
 */
recordRouter.get(
  "/:id",
  authorize(["Admin", "Analyst"]),
  getRecordByIdController
);

// ─── Write Routes — Admin Only ─────────────────────────

/**
 * POST /api/records
 * Creates a new financial record.
 * Body: { amount, type, category, date, notes? }
 * The `created_by` field is set from the authenticated user's ID.
 */
recordRouter.post(
  "/",
  authorize(["Admin"]),
  createRecordController
);

/**
 * PUT /api/records/:id
 * Updates an existing financial record.
 * Body: Partial of { amount, type, category, date, notes }
 */
recordRouter.put(
  "/:id",
  authorize(["Admin"]),
  updateRecordController
);

/**
 * DELETE /api/records/:id
 * Deletes a financial record.
 */
recordRouter.delete(
  "/:id",
  authorize(["Admin"]),
  deleteRecordController
);

export { recordRouter };
