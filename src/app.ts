
// Zorvyn Finance Backend — Express App Configuration


import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { authRouter } from "./modules/auth/auth.routes.js";
import { recordRouter } from "./modules/records/record.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { sendError } from "./utils/response.js";
import { globalErrorHandler } from "./middleware/index.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { env } from "./config/env.js";

const app = express();

// Security Middleware

app.use(helmet());                     // Security headers (hides X-Powered-By)
app.use(cors());                       // CORS

// Performance Middleware

app.use(compression());                // Gzip response compression

// Observability Middleware

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Body Parsing

app.use(express.json({ limit: "1mb" })); // JSON body parser

// Rate Limiting — applied to all /api routes

app.use("/api", apiLimiter);

// API Routes

app.use("/api/auth", authRouter);
app.use("/api/records", recordRouter);
app.use("/api/dashboard", dashboardRouter);

// Health Check

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 Handler
// Must come AFTER all route registrations.

app.use((_req, res) => {
  sendError(res, "Route not found", 404);
});

// Global Error Handler
// Must be the LAST middleware registered.
// Express identifies error handlers by their 4-arg signature.

app.use(globalErrorHandler);

export { app };
