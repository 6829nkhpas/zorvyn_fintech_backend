// Records Module — Controller Layer
// Thin HTTP adapter: validates → delegates → responds.
// Errors are forwarded to the global error handler via catchAsync.

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
} from "./record.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { catchAsync } from "../../utils/catchAsync.js";

// POST /api/records

export const createRecordController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const parsed = createRecordSchema.safeParse(req.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
      sendError(res, firstIssue, 400);
      return;
    }

    const record = await createRecord(parsed.data, req.user!.id);
    sendSuccess(res, record, 201);
  }
);

// GET /api/records

export const getAllRecordsController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const parsed = recordQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
      sendError(res, firstIssue, 400);
      return;
    }

    const result = await findAllRecords(parsed.data);
    sendSuccess(res, result, 200);
  }
);

// GET /api/records/:id

export const getRecordByIdController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const paramParsed = idParamSchema.safeParse(req.params);

    if (!paramParsed.success) {
      const firstIssue = paramParsed.error.issues[0]?.message ?? "Invalid ID";
      sendError(res, firstIssue, 400);
      return;
    }

    const record = await findRecordById(paramParsed.data.id);
    sendSuccess(res, record, 200);
  }
);

// PUT /api/records/:id 

export const updateRecordController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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

    const record = await updateRecord(paramParsed.data.id, bodyParsed.data);
    sendSuccess(res, record, 200);
  }
);

// DELETE /api/records/:id

export const deleteRecordController = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const paramParsed = idParamSchema.safeParse(req.params);

    if (!paramParsed.success) {
      const firstIssue = paramParsed.error.issues[0]?.message ?? "Invalid ID";
      sendError(res, firstIssue, 400);
      return;
    }

    await deleteRecord(paramParsed.data.id);
    sendSuccess(res, { message: "Record deleted successfully" }, 200);
  }
);
