import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = AppError.badRequest(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value for '${field}'. Please use another value.`;
    error = AppError.conflict(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((el: any) => ({
      field: el.path,
      message: el.message,
    }));
    error = AppError.badRequest('Validation failed', details);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.status === 'fail' ? 'BAD_REQUEST' : 'SERVER_ERROR',
      details: error.details || undefined,
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
};