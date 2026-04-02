// Async Controller Wrapper
// Wraps async route handlers to forward thrown errors
// to Express's next() — preventing unhandled rejections
// from crashing the Node process.

import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Wraps an async Express handler so that any rejected promise
 * is automatically caught and forwarded to Express error middleware.
 *
 * Usage:
 *   router.get("/path", catchAsync(myController));
 */
export function catchAsync(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
