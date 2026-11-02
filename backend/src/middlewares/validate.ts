import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      sendError(
        res,
        'Validation error',
        422,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
      );
      return;
    }
    req[source] = result.data;
    next();
  };
}
