import { z } from "zod";
import * as dotenv from "dotenv";

// Load .env before validation
dotenv.config();

// Schema

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string"),

  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters"),

  JWT_EXPIRES_IN: z
    .string()
    .default("24h"),

  PORT: z
    .string()
    .default("3000")
    .transform(Number)
    .pipe(z.number().int().positive()),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validate & Export

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
