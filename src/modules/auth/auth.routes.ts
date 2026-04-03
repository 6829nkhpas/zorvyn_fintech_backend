// Auth Module — Route Definitions

import { Router } from "express";
import { loginController } from "./auth.controller.js";
import { authLimiter } from "../../middleware/rateLimiter.js";

const authRouter = Router();

/**
 * POST /api/auth/login
 * Public endpoint — no authentication required.
 * Rate-limited to 5 attempts per 15 minutes per IP.
 * Body: { email: string, password: string }
 * Response: { success: true, data: { token: string }, error: null }
 */
authRouter.post("/login", authLimiter, loginController);

export { authRouter };
