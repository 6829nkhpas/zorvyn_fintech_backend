// Records Module — Zod Validation Schemas

import { z } from "zod";

// Create Record Schema

export const createRecordSchema = z.object({
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be positive")
    .finite("Amount must be finite"),

  type: z.enum(["income", "expense"], {
    error: "Type must be 'income' or 'expense'",
  }),

  category: z
    .string({ error: "Category is required" })
    .min(1, "Category must not be empty")
    .max(100, "Category must not exceed 100 characters"),

  date: z
    .string({ error: "Date is required" })
    .date("Date must be a valid ISO date (YYYY-MM-DD)")
    .transform((val) => new Date(val)),

  notes: z
    .string()
    .max(5000, "Notes must not exceed 5000 characters")
    .nullish(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;

// Update Record Schema
// All fields are optional — partial update (PATCH semantics via PUT).

export const updateRecordSchema = z
  .object({
    amount: z
      .number({ error: "Amount must be a number" })
      .positive("Amount must be positive")
      .finite("Amount must be finite"),

    type: z.enum(["income", "expense"], {
      error: "Type must be 'income' or 'expense'",
    }),

    category: z
      .string()
      .min(1, "Category must not be empty")
      .max(100, "Category must not exceed 100 characters"),

    date: z
      .string()
      .date("Date must be a valid ISO date (YYYY-MM-DD)")
      .transform((val) => new Date(val)),

    notes: z
      .string()
      .max(5000, "Notes must not exceed 5000 characters")
      .nullish(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;

// Query Params Schema
// All fields optional — used for filtering + pagination on GET /api/records.
// Query params arrive as strings, so we coerce numbers.

export const recordQuerySchema = z.object({
  type: z
    .enum(["income", "expense"], {
      error: "Type filter must be 'income' or 'expense'",
    })
    .optional(),

  category: z
    .string()
    .max(100, "Category filter must not exceed 100 characters")
    .optional(),

  startDate: z
    .string()
    .date("startDate must be a valid ISO date (YYYY-MM-DD)")
    .optional(),

  endDate: z
    .string()
    .date("endDate must be a valid ISO date (YYYY-MM-DD)")
    .optional(),

  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be positive")
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be positive")
    .max(100, "Limit must not exceed 100")
    .default(20),
});

export type RecordQueryInput = z.infer<typeof recordQuerySchema>;

// ID Param Schema

export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "ID must be a number" })
    .int("ID must be an integer")
    .positive("ID must be positive"),
});
