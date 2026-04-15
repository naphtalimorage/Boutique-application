import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      const details = error instanceof ZodError
        ? error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        : undefined;

      res.status(400).json({
        error: 'Validation error',
        details,
      });
    }
  };
};
