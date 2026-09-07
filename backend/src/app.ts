import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { AppError } from './utils/appError';

const app: Application = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (Vercel, localhost, preview URLs, curl)
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API v1 Routes
app.use('/api/v1', apiRoutes);

// Fallback for unhandled routes
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// Centralized error handler
app.use(errorHandler);

export default app;