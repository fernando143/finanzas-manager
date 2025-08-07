import { Router } from 'express'
import { MercadoPagoController } from '../controllers'
import { authMiddleware } from '../middleware'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// MercadoPago OAuth token endpoint
// POST /api/mercadopago/token
router.post('/token', MercadoPagoController.getToken)

// MercadoPago payments search endpoint  
// GET /api/mercadopago/payments/search
router.get('/payments/search', MercadoPagoController.searchPayments)

// Get recent payments filtered as expenses
// GET /api/mercadopago/payments/expenses
router.get('/payments/expenses', MercadoPagoController.getExpensePayments)

export default router