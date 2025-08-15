import { Response } from 'express'
import { z } from 'zod'
import { collectorService } from '../services'
import { AuthenticatedRequest, asyncHandler } from '../middleware'

// Validation schemas
const CollectorCreateSchema = z.object({
  collectorId: z.string().min(1, 'Collector ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
})

const CollectorUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
})

const CollectorQuerySchema = z.object({
  includeExpenseCount: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  sort: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const CollectorController = {
  // GET /api/collectors
  getAll: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const query = CollectorQuerySchema.parse(req.query)
    
    const collectors = await collectorService.findMany(userId, {
      includeExpenseCount: query.includeExpenseCount,
      orderBy: { [query.sort]: query.order },
    })
    
    res.json({
      success: true,
      data: collectors,
    })
  }),
  
  // GET /api/collectors/:id
  getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    
    const collector = await collectorService.findById(userId, id)
    
    if (!collector) {
      return res.status(404).json({
        success: false,
        error: 'Collector not found',
      })
    }
    
    res.json({
      success: true,
      data: collector,
    })
  }),
  
  // POST /api/collectors
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const data = CollectorCreateSchema.parse(req.body)
    
    try {
      const collector = await collectorService.create(userId, data)
      
      res.status(201).json({
        success: true,
        data: collector,
        message: 'Collector created successfully',
      })
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'A collector with this ID already exists',
        })
      }
      throw error
    }
  }),
  
  // PUT /api/collectors/:id
  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    const data = CollectorUpdateSchema.parse(req.body)
    
    try {
      const collector = await collectorService.update(userId, id, data)
      
      res.json({
        success: true,
        data: collector,
        message: 'Collector updated successfully',
      })
    } catch (error: any) {
      if (error.message === 'Collector not found') {
        return res.status(404).json({
          success: false,
          error: 'Collector not found',
        })
      }
      throw error
    }
  }),
  
  // DELETE /api/collectors/:id
  delete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const { id } = req.params
    
    try {
      const collector = await collectorService.delete(userId, id)
      
      res.json({
        success: true,
        data: collector,
        message: 'Collector deleted successfully',
      })
    } catch (error: any) {
      if (error.message === 'Collector not found') {
        return res.status(404).json({
          success: false,
          error: 'Collector not found',
        })
      }
      if (error.message === 'Cannot delete collector with associated expenses') {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete collector with associated expenses',
        })
      }
      throw error
    }
  }),
}