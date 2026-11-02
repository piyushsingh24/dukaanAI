import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err);

  if (err instanceof ZodError) {
    sendError(
      res,
      'Validation error',
      422,
      err.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    );
    return;
  }

  sendError(res, err.message || 'Internal server error', 500);
}
