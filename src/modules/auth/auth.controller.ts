// ─────────────────────────────────────────────────────────
// Auth Module — Controller Layer
// Thin HTTP adapter: validates → delegates → responds.
// ─────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { loginSchema } from "./auth.validation.js";
import { login, AuthError } from "./auth.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

/**
 * POST /api/auth/login
 * Accepts { email, password }, returns { token } on success.
 */
export async function loginController(
  req: Request,
  res: Response
): Promise<void> {
  // 1. Validate request body with Zod
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    sendError(res, firstIssue, 400);
    return;
  }

  try {
    // 2. Delegate to auth service
    const result = await login(parsed.data.email, parsed.data.password);

    // 3. Return signed token
    sendSuccess(res, result, 200);
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error.message, error.statusCode);
      return;
    }

    // Unexpected errors — don't leak internals
    console.error("[Auth] Unexpected error during login:", error);
    sendError(res, "Internal server error", 500);
  }
}
