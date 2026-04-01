// ─────────────────────────────────────────────────────────
// Auth Module — Route Definitions
// ─────────────────────────────────────────────────────────

import { Router } from "express";
import { loginController } from "./auth.controller.js";

const authRouter = Router();

/**
 * POST /api/auth/login
 * Public endpoint — no authentication required.
 * Body: { email: string, password: string }
 * Response: { success: true, data: { token: string }, error: null }
 */
authRouter.post("/login", loginController);

export { authRouter };
