// Global Error Handler Middleware
// Catches all unhandled errors and returns a consistent
// { success: false, data: null, error: string } response.
//
// Specifically handles:
//   • Zod validation errors           → 400
//   • Prisma known request errors     → 400/409 (contextual)
//   • Application-level errors        → their statusCode
//   • Everything else                 → 500
//
// In production, database stack traces are NEVER leaked.

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/index.js";
import { env } from "../config/env.js";

interface AppError extends Error {
  statusCode?: number;
}

/**
 * Express error-handling middleware (4-arg signature).
 * Must be registered AFTER all routes.
 */
export function globalErrorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod Validation Errors
  if (err instanceof ZodError) {
    const messages = err.issues.map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    });

    res.status(400).json({
      success: false,
      data: null,
      error: messages.join("; "),
    });
    return;
  }

  // Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaMessage = formatPrismaError(err);

    res.status(prismaMessage.statusCode).json({
      success: false,
      data: null,
      error: prismaMessage.message,
    });
    return;
  }

  // Prisma Validation Errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      data: null,
      error: "Invalid data provided to database operation",
    });
    return;
  }

  // Application Errors (AuthError, RecordError, etc.)
  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message,
    });
    return;
  }

  // Fallback: Unexpected Errors
  // Log the full stack trace server-side for debugging
  console.error("[GlobalErrorHandler] Unhandled error:", err);

  res.status(500).json({
    success: false,
    data: null,
    // Never leak internal details in production
    error:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
}

// Prisma Error Formatter

function formatPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  message: string;
  statusCode: number;
} {
  switch (err.code) {
    // Unique constraint violation
    case "P2002": {
      const target = (err.meta?.target as string[]) ?? [];
      const fields = target.length > 0 ? target.join(", ") : "field";
      return {
        message: `A record with this ${fields} already exists`,
        statusCode: 409,
      };
    }

    // Record not found (update / delete on non-existent row)
    case "P2025":
      return {
        message: "Record not found",
        statusCode: 404,
      };

    // Foreign key constraint failure
    case "P2003": {
      const field = (err.meta?.field_name as string) ?? "relation";
      return {
        message: `Invalid reference: related ${field} does not exist`,
        statusCode: 400,
      };
    }

    // Catch-all for other Prisma codes
    default:
      return {
        message:
          env.NODE_ENV === "production"
            ? "A database error occurred"
            : `Database error [${err.code}]: ${err.message}`,
        statusCode: 400,
      };
  }
}
