// ─────────────────────────────────────────────────────────
// Auth Module — Controller Layer
// Thin HTTP adapter: validates → delegates → responds.
// Errors are forwarded to the global error handler via catchAsync.
// ─────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { loginSchema } from "./auth.validation.js";
import { login } from "./auth.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { catchAsync } from "../../utils/catchAsync.js";

/**
 * POST /api/auth/login
 * Accepts { email, password }, returns { token } on success.
 */
export const loginController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // 1. Validate request body with Zod
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
      sendError(res, firstIssue, 400);
      return;
    }

    // 2. Delegate to auth service
    const result = await login(parsed.data.email, parsed.data.password);

    // 3. Return signed token
    sendSuccess(res, result, 200);
  }
);
