import { Response } from 'express'
import { z } from 'zod'
import { categoryService } from '../services'
import { AuthenticatedRequest, asyncHandler } from '../middleware'
import { CategoryWhereClause } from '../types'

// Validation schemas
const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  parentId: z.string().min(1).optional(), // Changed from cuid() to accept existing category ID format
})

const CategoryUpdateSchema = CategoryCreateSchema.partial()

const CategoryQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  includeGlobal: z.string().optional().transform(val => val !== 'false'),
  parentId: z.string().min(1).optional(), // Changed from cuid() to accept existing category ID format
  sort: z.enum(['name', 'type', 'createdAt']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const CategoryController = {
  // GET /api/categories
  getAll: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const query = CategoryQuerySchema.parse(req.query)
    
    const { page, limit, type, includeGlobal, parentId, sort, order } = query
    
    // Build where clause
    const whereClause: CategoryWhereClause = {}
    if (type) whereClause.type = type
    if (parentId !== undefined) whereClause.parentId = parentId
    
    const categories = await categoryService.findMany(userId, {
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: { [sort]: order },
      includeGlobal,
    })
    
    res.status(200).json({
      success: true,
      data: { categories },
    })
  }),

  // GET /api/categories/:id
  getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    const { includeGlobal } = req.query
    
    const category = await categoryService.findById(
      userId, 
      id, 
      includeGlobal !== 'false'
    )
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND',
      })
    }
    
    res.status(200).json({
      success: true,
      data: { category },
    })
  }),

  // POST /api/categories
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const validatedData = CategoryCreateSchema.parse(req.body)
    
    const category = await categoryService.create(userId, validatedData)
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    })
  }),

  // PUT /api/categories/:id
  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    const validatedData = CategoryUpdateSchema.parse(req.body)
    
    const category = await categoryService.update(userId, id, validatedData)
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    })
  }),

  // DELETE /api/categories/:id
  delete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    
    await categoryService.delete(userId, id)
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    })
  }),

  // GET /api/categories/search
  search: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { q, includeGlobal } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        code: 'MISSING_QUERY',
      })
    }
    
    const categories = await categoryService.search(
      userId, 
      q, 
      includeGlobal !== 'false'
    )
    
    res.status(200).json({
      success: true,
      data: { categories },
    })
  }),

  // GET /api/categories/hierarchy
  getHierarchy: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { type, includeGlobal } = req.query
    
    const categories = await categoryService.getHierarchy(
      userId,
      type as 'INCOME' | 'EXPENSE' | undefined,
      includeGlobal !== 'false'
    )
    
    res.status(200).json({
      success: true,
      data: { categories },
    })
  }),

  // GET /api/categories/by-type/:type
  getByType: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { type } = req.params
    const { includeGlobal } = req.query
    
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category type',
        code: 'INVALID_TYPE',
      })
    }
    
    const categories = await categoryService.findByType(
      userId,
      type as 'INCOME' | 'EXPENSE',
      includeGlobal !== 'false'
    )
    
    res.status(200).json({
      success: true,
      data: { categories },
    })
  }),
}