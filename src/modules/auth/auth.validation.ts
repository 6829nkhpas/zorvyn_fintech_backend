// Auth Module — Zod Validation Schemas

import { z } from "zod";

/**
 * Login request body schema.
 * Validates email format and ensures password is non-empty.
 */
export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .email("Must be a valid email address")
    .max(320, "Email must not exceed 320 characters"),

  password: z
    .string({ error: "Password is required" })
    .min(1, "Password must not be empty"),
});

export type LoginInput = z.infer<typeof loginSchema>;
