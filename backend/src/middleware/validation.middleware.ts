import { Request, Response, NextFunction } from 'express'
import { ZodSchema, z } from 'zod'

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedQuery = schema.parse(req.query)
      req.query = parsedQuery as any
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedParams = schema.parse(req.params)
      req.params = parsedParams as any
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Common validation schemas
export const IdParamSchema = z.object({
  id: z.string().cuid(),
})

export const PaginationQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
})

// Middleware to transform pagination query to Prisma options
export const paginationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page, limit } = req.query as any
  
  const pageNum = Math.max(1, parseInt(page as string) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
  
  req.pagination = {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  }
  
  next()
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        skip: number
        take: number
        page: number
        limit: number
      }
    }
  }
}