import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './appError';

export interface JwtUserPayload {
  id: string;
  role: string;
}

export const generateToken = (payload: JwtUserPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): JwtUserPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Authentication token has expired. Please login again.');
    }
    throw AppError.unauthorized('Invalid authentication token.');
  }
};