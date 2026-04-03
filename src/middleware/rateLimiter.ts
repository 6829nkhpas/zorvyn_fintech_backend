// Rate Limiting Middleware
// Prevents brute-force attacks and API abuse.
//
// Exports two limiters:
//   • apiLimiter  — General: 100 requests per 15 min window
//   • authLimiter — Strict:  5 attempts per 15 min window

import rateLimit from "express-rate-limit";

/**
 * General API rate limiter.
 * Applied globally to all `/api` routes.
 * Allows 100 requests per 15-minute sliding window per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,    // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,     // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    data: null,
    error: "Too many requests. Please try again later.",
  },
});

/**
 * Strict rate limiter for authentication endpoints.
 * Applied specifically to POST /api/auth/login.
 * Allows only 5 attempts per 15-minute window per IP
 * to prevent brute-force credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: "Too many login attempts. Please try again after 15 minutes.",
  },
});
