// ─────────────────────────────────────────────────────────
// Dashboard Module — Controller Layer
// Thin HTTP adapter: delegates → responds.
// ─────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { getDashboardSummary } from "./dashboard.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

// ─── GET /api/dashboard/summary ────────────────────────

export async function getSummaryController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const summary = await getDashboardSummary();
    sendSuccess(res, summary, 200);
  } catch (error) {
    console.error("[Dashboard] Unexpected error:", error);
    sendError(res, "Internal server error", 500);
  }
}
