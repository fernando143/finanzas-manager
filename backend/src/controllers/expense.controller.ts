import { Response } from 'express'
import { z } from 'zod'
import { expenseService } from '../services'
import { AuthenticatedRequest, asyncHandler } from '../middleware'
import { ExpenseWhereClause } from '../types'

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
const ExpenseCreateSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string(), // Simplified validation to debug CUID issue
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']),
  dueDate: z.string().datetime().optional().refine(
    (dateString) => !dateString || validateGMT3NoonDate(dateString),
    { message: 'Due date must be set to 12:00 noon GMT-3 (15:00 UTC)' }
  ),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']).default('PENDING'),
})

const ExpenseUpdateSchema = ExpenseCreateSchema.partial()

const ExpenseQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  category: z.string().optional(),
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']).optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sort: z.enum(['dueDate', 'amount', 'description', 'createdAt']).optional().default('dueDate'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const ExpenseController = {
  // GET /api/expenses
  getAll: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const query = ExpenseQuerySchema.parse(req.query)
    
    const { page, limit, category, frequency, status, dateFrom, dateTo, sort, order } = query
    
    // Build where clause
    const whereClause: ExpenseWhereClause = {}
    if (category) whereClause.categoryId = category
    if (frequency) whereClause.frequency = frequency
    if (status) whereClause.status = status
    if (dateFrom || dateTo) {
      whereClause.dueDate = {}
      if (dateFrom) whereClause.dueDate.gte = new Date(dateFrom)
      if (dateTo) whereClause.dueDate.lte = new Date(dateTo)
    }
    
    const expenses = await expenseService.findMany(userId, {
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: { [sort]: order },
    })
    
    const total = await expenseService.count(userId, whereClause)
    
    res.status(200).json({
      success: true,
      data: {
        expenses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  }),

  // GET /api/expenses/:id
  getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    
    const expense = await expenseService.findById(userId, id)
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
        code: 'EXPENSE_NOT_FOUND',
      })
    }
    
    res.status(200).json({
      success: true,
      data: { expense },
    })
  }),

  // POST /api/expenses
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const validatedData = ExpenseCreateSchema.parse(req.body)
    
    const expense = await expenseService.create(userId, validatedData)
    
    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense },
    })
  }),

  // PUT /api/expenses/:id
  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    const validatedData = ExpenseUpdateSchema.parse(req.body)
    
    const expense = await expenseService.update(userId, id, validatedData)
    
    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense },
    })
  }),

  // DELETE /api/expenses/:id
  delete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    
    await expenseService.delete(userId, id)
    
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    })
  }),

  // GET /api/expenses/search
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
    
    const expenses = await expenseService.search(userId, q)
    
    res.status(200).json({
      success: true,
      data: { expenses },
    })
  }),

  // GET /api/expenses/upcoming
  getUpcoming: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { days } = req.query
    
    const daysNum = days ? parseInt(days as string) : 7
    const expenses = await expenseService.findUpcoming(userId, daysNum)
    
    res.status(200).json({
      success: true,
      data: { expenses },
    })
  }),

  // GET /api/expenses/overdue
  getOverdue: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    
    const expenses = await expenseService.findOverdue(userId)
    
    res.status(200).json({
      success: true,
      data: { expenses },
    })
  }),

  // GET /api/expenses/aggregate
  getAggregate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { category, frequency, status, dateFrom, dateTo } = req.query
    
    // Build where clause
    const whereClause: ExpenseWhereClause = {}
    if (category) whereClause.categoryId = category as string
    if (frequency) whereClause.frequency = frequency as 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'ANNUAL' | 'ONE_TIME'
    if (status) whereClause.status = status as 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
    if (dateFrom || dateTo) {
      whereClause.dueDate = {}
      if (dateFrom) whereClause.dueDate.gte = new Date(dateFrom as string)
      if (dateTo) whereClause.dueDate.lte = new Date(dateTo as string)
    }
    
    const aggregate = await expenseService.aggregate(userId, whereClause)
    
    res.status(200).json({
      success: true,
      data: { 
        totalAmount: aggregate._sum.amount || 0,
        averageAmount: aggregate._avg.amount || 0,
        count: aggregate._count,
      },
    })
  }),

  // GET /api/expenses/count
  getCount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { category, frequency, status } = req.query
    
    // Build where clause
    const whereClause: ExpenseWhereClause = {}
    if (category) whereClause.categoryId = category as string
    if (frequency) whereClause.frequency = frequency as 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'ANNUAL' | 'ONE_TIME'
    if (status) whereClause.status = status as 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
    
    const count = await expenseService.count(userId, whereClause)
    
    res.status(200).json({
      success: true,
      data: { count },
    })
  }),
}