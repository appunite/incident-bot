/**
 * Error handling utilities
 */

import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Logs error and returns user-friendly message
 */
export function handleError(error: unknown, context: string): string {
  const err = error as Error;

  logger.error(`Error in ${context}:`, {
    message: err.message,
    stack: err.stack,
    context,
  });

  // Return user-friendly message
  if (err instanceof AppError && err.isOperational) {
    return err.message;
  }

  return 'An unexpected error occurred. Please try again or contact support.';
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T>(
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
}
