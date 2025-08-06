import { Router } from 'express'
import { CategoryController } from '../controllers'
import { authMiddleware, validateBody, validateParams, IdParamSchema } from '../middleware'
import { z } from 'zod'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Validation schemas
const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  parentId: z.string().cuid().optional(),
})

const CategoryUpdateSchema = CategoryCreateSchema.partial()

// Routes
router.get('/search', CategoryController.search)
router.get('/hierarchy', CategoryController.getHierarchy)
router.get('/', CategoryController.getAll)
router.get('/:id', validateParams(IdParamSchema), CategoryController.getById)
router.post('/', validateBody(CategoryCreateSchema), CategoryController.create)
router.put('/:id', validateParams(IdParamSchema), validateBody(CategoryUpdateSchema), CategoryController.update)
router.delete('/:id', validateParams(IdParamSchema), CategoryController.delete)

export default router