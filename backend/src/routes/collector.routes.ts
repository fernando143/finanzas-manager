import { Router } from 'express'
import { CollectorController } from '../controllers'
import { authMiddleware } from '../middleware'

const router = Router()

// All collector routes require authentication
router.use(authMiddleware)

// GET /api/collectors - Get all collectors for the authenticated user
router.get('/', CollectorController.getAll)

// GET /api/collectors/:id - Get a specific collector by ID
router.get('/:id', CollectorController.getById)

// POST /api/collectors - Create a new collector
router.post('/', CollectorController.create)

// PUT /api/collectors/:id - Update a collector
router.put('/:id', CollectorController.update)

// DELETE /api/collectors/:id - Delete a collector
router.delete('/:id', CollectorController.delete)

export default router