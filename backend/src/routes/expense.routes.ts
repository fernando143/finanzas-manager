import { Router } from 'express'
import { ExpenseController } from '../controllers'
import { authMiddleware, validateBody, validateParams, IdParamSchema } from '../middleware'
import { z } from 'zod'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Validation schemas
const ExpenseCreateSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string(), // Simplified validation to debug CUID issue
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']).default('PENDING'),
  mercadoPagoPaymentId: z.string().optional(),
  dateApproved: z.string().datetime().optional(), // Date when the payment was approved by MercadoPago
  collectorId: z.string().optional(),
})

const ExpenseUpdateSchema = ExpenseCreateSchema.partial()

// Routes
router.get('/search', ExpenseController.search)
router.get('/upcoming', ExpenseController.getUpcoming)
router.get('/overdue', ExpenseController.getOverdue)
router.get('/aggregate', ExpenseController.getAggregate)
router.get('/count', ExpenseController.getCount)
router.get('/dashboard/current-month', ExpenseController.getDashboardCurrentMonth)
router.get('/', ExpenseController.getAll)
router.get('/:id', validateParams(IdParamSchema), ExpenseController.getById)
router.post('/', validateBody(ExpenseCreateSchema), ExpenseController.create)
router.put('/:id', validateParams(IdParamSchema), validateBody(ExpenseUpdateSchema), ExpenseController.update)
router.patch('/:id', validateParams(IdParamSchema), validateBody(ExpenseUpdateSchema), ExpenseController.update)
router.delete('/:id', validateParams(IdParamSchema), ExpenseController.delete)

export default router