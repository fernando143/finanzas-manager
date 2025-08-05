import { Router } from 'express'
import { IncomeController } from '../controllers'
import { authMiddleware, validateBody, validateParams, IdParamSchema } from '../middleware'
import { z } from 'zod'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Validation schemas
const IncomeCreateSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string().min(1), // Changed from cuid() to accept existing category ID format
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']),
  incomeDate: z.string().datetime(),
  nextDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
})

const IncomeUpdateSchema = IncomeCreateSchema.partial()

// Routes
router.get('/search', IncomeController.search)
router.get('/aggregate', IncomeController.getAggregate)
router.get('/count', IncomeController.getCount)
router.get('/dashboard/current-month', IncomeController.getDashboardCurrentMonth)
router.get('/', IncomeController.getAll)
router.get('/:id', validateParams(IdParamSchema), IncomeController.getById)
router.post('/', validateBody(IncomeCreateSchema), IncomeController.create)
router.put('/:id', validateParams(IdParamSchema), validateBody(IncomeUpdateSchema), IncomeController.update)
router.delete('/:id', validateParams(IdParamSchema), IncomeController.delete)

export default router