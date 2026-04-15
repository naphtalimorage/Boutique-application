import { Request, Response, NextFunction } from 'express';

type ErrorWithStatus = {
  statusCode?: number;
  message?: string;
  stack?: string;
};

const isErrorWithStatus = (value: unknown): value is ErrorWithStatus =>
  typeof value === 'object' && value !== null && ('statusCode' in value || 'message' in value || 'stack' in value);

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  void _next;
  console.error('Error:', err);

  const errorObj = isErrorWithStatus(err) ? err : {};
  const statusCode = typeof errorObj.statusCode === 'number' ? errorObj.statusCode : 500;
  const message = typeof errorObj.message === 'string' ? errorObj.message : 'Internal Server Error';
  const stack = typeof errorObj.stack === 'string' ? errorObj.stack : undefined;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};
