// Authentication & Authorization Middleware

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";
import type { AuthTokenPayload } from "../types/jwt.js";
import type { Role } from "../generated/prisma/index.js";

// authenticate
// Extracts and verifies the JWT from the Authorization header.
// On success, attaches the decoded payload to `req.user`.

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, "Missing or malformed Authorization header", 401);
    return;
  }

  const token = authHeader.slice(7); // Strip "Bearer "

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as AuthTokenPayload;

    // Attach user context for downstream handlers
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, "Token has expired", 401);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      sendError(res, "Invalid token", 401);
      return;
    }

    sendError(res, "Authentication failed", 401);
  }
}

// authorize
// Factory that returns a middleware checking `req.user.role`
// against the provided list of allowed roles.
// MUST be used AFTER `authenticate`.

export function authorize(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      // Should never happen if authenticate runs first, but guard defensively
      sendError(res, "Authentication required", 401);
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      sendError(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
        403
      );
      return;
    }

    next();
  };
}
