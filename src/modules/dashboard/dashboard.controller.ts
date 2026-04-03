// Dashboard Module — Controller Layer
// Thin HTTP adapter: delegates → responds.
// Errors are forwarded to the global error handler via catchAsync.

import type { Request, Response } from "express";
import { getDashboardSummary } from "./dashboard.service.js";
import { sendSuccess } from "../../utils/response.js";
import { catchAsync } from "../../utils/catchAsync.js";

// GET /api/dashboard/summary

export const getSummaryController = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const summary = await getDashboardSummary();
    sendSuccess(res, summary, 200);
  }
);
