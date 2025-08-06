import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (
  error: AppError | ZodError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body as unknown,
    query: req.query,
    params: req.params,
  })

  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    })
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'A record with this value already exists',
          code: 'DUPLICATE_RECORD',
          field: error.meta?.target,
        })
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Record not found',
          code: 'RECORD_NOT_FOUND',
        })
      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'Foreign key constraint failed',
          code: 'FOREIGN_KEY_ERROR',
        })
      case 'P2011':
        return res.status(400).json({
          success: false,
          error: 'Null constraint violation',
          code: 'NULL_CONSTRAINT_ERROR',
        })
      default:
        return res.status(500).json({
          success: false,
          error: 'Database error occurred',
          code: 'DATABASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        })
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }

  // Custom app errors
  if ((error as AppError).statusCode) {
    return res.status((error as AppError).statusCode!).json({
      success: false,
      error: error.message,
      code: (error as AppError).code || 'APP_ERROR',
    })
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  })
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}