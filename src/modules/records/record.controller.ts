// ─────────────────────────────────────────────────────────
// Records Module — Controller Layer
// Thin HTTP adapter: validates → delegates → responds.
// ─────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import {
  createRecordSchema,
  updateRecordSchema,
  recordQuerySchema,
  idParamSchema,
} from "./record.validation.js";
import {
  createRecord,
  findAllRecords,
  findRecordById,
  updateRecord,
  deleteRecord,
  RecordError,
} from "./record.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";

// ─── POST /api/records ─────────────────────────────────

export async function createRecordController(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createRecordSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    sendError(res, firstIssue, 400);
    return;
  }

  try {
    const record = await createRecord(parsed.data, req.user!.id);
    sendSuccess(res, record, 201);
  } catch (error) {
    handleServiceError(res, error);
  }
}

// ─── GET /api/records ──────────────────────────────────

export async function getAllRecordsController(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = recordQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    sendError(res, firstIssue, 400);
    return;
  }

  try {
    const result = await findAllRecords(parsed.data);
    sendSuccess(res, result, 200);
  } catch (error) {
    handleServiceError(res, error);
  }
}

// ─── GET /api/records/:id ──────────────────────────────

export async function getRecordByIdController(
  req: Request,
  res: Response
): Promise<void> {
  const paramParsed = idParamSchema.safeParse(req.params);

  if (!paramParsed.success) {
    const firstIssue = paramParsed.error.issues[0]?.message ?? "Invalid ID";
    sendError(res, firstIssue, 400);
    return;
  }

  try {
    const record = await findRecordById(paramParsed.data.id);
    sendSuccess(res, record, 200);
  } catch (error) {
    handleServiceError(res, error);
  }
}

// ─── PUT /api/records/:id ──────────────────────────────

export async function updateRecordController(
  req: Request,
  res: Response
): Promise<void> {
  const paramParsed = idParamSchema.safeParse(req.params);

  if (!paramParsed.success) {
    const firstIssue = paramParsed.error.issues[0]?.message ?? "Invalid ID";
    sendError(res, firstIssue, 400);
    return;
  }

  const bodyParsed = updateRecordSchema.safeParse(req.body);

  if (!bodyParsed.success) {
    const firstIssue = bodyParsed.error.issues[0]?.message ?? "Validation failed";
    sendError(res, firstIssue, 400);
    return;
  }

  try {
    const record = await updateRecord(paramParsed.data.id, bodyParsed.data);
    sendSuccess(res, record, 200);
  } catch (error) {
    handleServiceError(res, error);
  }
}

// ─── DELETE /api/records/:id ───────────────────────────

export async function deleteRecordController(
  req: Request,
  res: Response
): Promise<void> {
  const paramParsed = idParamSchema.safeParse(req.params);

  if (!paramParsed.success) {
    const firstIssue = paramParsed.error.issues[0]?.message ?? "Invalid ID";
    sendError(res, firstIssue, 400);
    return;
  }

  try {
    await deleteRecord(paramParsed.data.id);
    sendSuccess(res, { message: "Record deleted successfully" }, 200);
  } catch (error) {
    handleServiceError(res, error);
  }
}

// ─── Shared Error Handler ──────────────────────────────

function handleServiceError(res: Response, error: unknown): void {
  if (error instanceof RecordError) {
    sendError(res, error.message, error.statusCode);
    return;
  }

  console.error("[Records] Unexpected error:", error);
  sendError(res, "Internal server error", 500);
}
