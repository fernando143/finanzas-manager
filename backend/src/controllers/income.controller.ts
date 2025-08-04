import { Response } from 'express'
import { z } from 'zod'
import { incomeService } from '../services'
import { AuthenticatedRequest, asyncHandler } from '../middleware'

// Helper function to validate GMT-3 noon dates (15:00 UTC)
const validateGMT3NoonDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return false
  
  // Check if the time component is 15:00:00.000Z (12:00 GMT-3)
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const seconds = date.getUTCSeconds()
  const milliseconds = date.getUTCMilliseconds()
  
  return hours === 15 && minutes === 0 && seconds === 0 && milliseconds === 0
}

// Validation schemas
const IncomeCreateSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string(), // Simplified validation to debug CUID issue
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']),
  incomeDate: z.string().datetime().refine(
    (dateString) => validateGMT3NoonDate(dateString),
    { message: 'Income date must be set to 12:00 noon GMT-3 (15:00 UTC)' }
  ),
  nextDate: z.string().datetime().optional().refine(
    (dateString) => !dateString || validateGMT3NoonDate(dateString),
    { message: 'Next date must be set to 12:00 noon GMT-3 (15:00 UTC)' }
  ),
  isActive: z.boolean().default(true),
})

const IncomeUpdateSchema = IncomeCreateSchema.partial()

const IncomeQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  category: z.string().optional(),
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']).optional(),
  isActive: z.string().optional().transform(val => val ? val === 'true' : undefined),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sort: z.enum(['incomeDate', 'amount', 'description', 'createdAt']).optional().default('incomeDate'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const IncomeController = {
  // GET /api/incomes
  getAll: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const query = IncomeQuerySchema.parse(req.query)
    
    const { page, limit, category, frequency, isActive, dateFrom, dateTo, sort, order } = query
    
    // Build where clause
    const whereClause: any = {}
    if (category) whereClause.categoryId = category
    if (frequency) whereClause.frequency = frequency
    if (isActive !== undefined) whereClause.isActive = isActive
    if (dateFrom || dateTo) {
      whereClause.incomeDate = {}
      if (dateFrom) whereClause.incomeDate.gte = new Date(dateFrom)
      if (dateTo) whereClause.incomeDate.lte = new Date(dateTo)
    }
    
    const incomes = await incomeService.findMany(userId, {
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: { [sort]: order },
    })
    
    const total = await incomeService.count(userId, whereClause)
    
    res.status(200).json({
      success: true,
      data: {
        incomes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  }),

  // GET /api/incomes/:id
  getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    
    const income = await incomeService.findById(userId, id)
    
    if (!income) {
      return res.status(404).json({
        success: false,
        error: 'Income not found',
        code: 'INCOME_NOT_FOUND',
      })
    }
    
    res.status(200).json({
      success: true,
      data: { income },
    })
  }),

  // POST /api/incomes
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const validatedData = IncomeCreateSchema.parse(req.body)
    
    const income = await incomeService.create(userId, validatedData)
    
    res.status(201).json({
      success: true,
      message: 'Income created successfully',
      data: { income },
    })
  }),

  // PUT /api/incomes/:id
  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    const validatedData = IncomeUpdateSchema.parse(req.body)
    
    const income = await incomeService.update(userId, id, validatedData)
    
    res.status(200).json({
      success: true,
      message: 'Income updated successfully',
      data: { income },
    })
  }),

  // DELETE /api/incomes/:id
  delete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    
    await incomeService.delete(userId, id)
    
    res.status(200).json({
      success: true,
      message: 'Income deleted successfully',
    })
  }),

  // GET /api/incomes/search
  search: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { q } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        code: 'MISSING_QUERY',
      })
    }
    
    const incomes = await incomeService.search(userId, q)
    
    res.status(200).json({
      success: true,
      data: { incomes },
    })
  }),

  // GET /api/incomes/aggregate
  getAggregate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { category, frequency, dateFrom, dateTo } = req.query
    
    // Build where clause
    const whereClause: any = {}
    if (category) whereClause.categoryId = category as string
    if (frequency) whereClause.frequency = frequency as string
    if (dateFrom || dateTo) {
      whereClause.incomeDate = {}
      if (dateFrom) whereClause.incomeDate.gte = new Date(dateFrom as string)
      if (dateTo) whereClause.incomeDate.lte = new Date(dateTo as string)
    }
    
    const aggregate = await incomeService.aggregate(userId, whereClause)
    
    res.status(200).json({
      success: true,
      data: { 
        totalAmount: aggregate._sum.amount || 0,
        averageAmount: aggregate._avg.amount || 0,
        count: aggregate._count,
      },
    })
  }),

  // GET /api/incomes/count
  getCount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { category, frequency, isActive } = req.query
    
    // Build where clause
    const whereClause: any = {}
    if (category) whereClause.categoryId = category as string
    if (frequency) whereClause.frequency = frequency as string
    if (isActive !== undefined) whereClause.isActive = isActive === 'true'
    
    const count = await incomeService.count(userId, whereClause)
    
    res.status(200).json({
      success: true,
      data: { count },
    })
  }),
}