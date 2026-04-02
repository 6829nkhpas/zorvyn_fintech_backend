
// Consistent API Response Helpers
// Every endpoint MUST use these to guarantee the shape:
// { success: boolean, data: T | null, error: string | null }

import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Send a success response.

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    error: null,
  } satisfies ApiResponse<T>);
}


 // Send an error response.

export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500
): void {
  res.status(statusCode).json({
    success: false,
    data: null,
    error,
  } satisfies ApiResponse);
}
