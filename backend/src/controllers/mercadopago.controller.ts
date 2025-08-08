import { Response } from 'express'
import { z } from 'zod'
import { mercadoPagoService, categoryService } from '../services'
import { AuthenticatedRequest, asyncHandler } from '../middleware'

// Validation schemas
const TokenRequestSchema = z.object({
  // Optional parameters for token request
}).optional()

const SearchPaymentsSchema = z.object({
  token: z.string().optional(),
  days: z.string().optional().transform(val => val ? parseInt(val) : 30),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
  status: z.string().optional(),
  operationType: z.string().optional(),
})

export const MercadoPagoController = {
  // POST /api/mercadopago/token
  getToken: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const token = await mercadoPagoService.getOAuthToken()
      
      res.status(200).json({
        success: true,
        message: 'MercadoPago OAuth token obtained successfully',
        data: {
          access_token: token.access_token,
          token_type: token.token_type,
          expires_in: token.expires_in,
          scope: token.scope,
        },
      })
    } catch (error) {
      console.error('Error getting MercadoPago token:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to obtain MercadoPago token',
        code: 'MP_TOKEN_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }),

  // GET /api/mercadopago/payments/search
  searchPayments: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = SearchPaymentsSchema.parse(req.query)
    const { token, days, limit, offset, status, operationType } = query

    try {
      // Calculate date range
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)
      const dateTo = new Date()

      const searchResponse = await mercadoPagoService.searchPayments({
        token,
        dateFrom,
        dateTo,
        limit,
        offset,
        status,
        operationType,
      })

      res.status(200).json({
        success: true,
        message: 'Payments retrieved successfully',
        data: {
          results: searchResponse.results,
          paging: searchResponse.paging,
          filters: {
            dateFrom: dateFrom.toISOString(),
            dateTo: dateTo.toISOString(),
            days,
            limit,
            offset,
            status,
            operationType,
          },
        },
      })
    } catch (error) {
      console.error('Error searching MercadoPago payments:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to search MercadoPago payments',
        code: 'MP_SEARCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }),

  // GET /api/mercadopago/payments/expenses
  getExpensePayments: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    const query = SearchPaymentsSchema.parse(req.query)
    const { days } = query

    try {
      // Get or create default MercadoPago category
      let defaultCategory
      try {
        // Try to find existing MercadoPago category
        const categories = await categoryService.findMany(userId, {
          where: {
            name: 'MercadoPago',
            type: 'EXPENSE'
          }
        })
        defaultCategory = categories[0]
        
        if (!defaultCategory) {
          // Create MercadoPago category if it doesn't exist
          defaultCategory = await categoryService.create(userId, {
            name: 'MercadoPago',
            type: 'EXPENSE',
            color: '#009EE3', // MercadoPago blue color
          })
        }
      } catch (error) {
        console.warn('Could not create MercadoPago category, using fallback:', error)
        // Fallback: try to get any expense category
        const expenseCategories = await categoryService.findMany(userId, {
          where: { type: 'EXPENSE' }
        })
        if (expenseCategories.length === 0) {
          throw new Error('No expense categories available. Please create at least one expense category first.')
        }
        defaultCategory = expenseCategories[0]
      }

      // Calculate date from days parameter if provided
      let dateFrom: Date | undefined
      if (days) {
        dateFrom = new Date()
        dateFrom.setDate(dateFrom.getDate() - days)
      }
      
      const result = await mercadoPagoService.getRecentExpensePayments(
        userId, 
        defaultCategory.id, 
        dateFrom
      )

      res.status(200).json({
        success: true,
        message: 'MercadoPago expense payments retrieved successfully',
        data: {
          expenses: result.expenses,
          totalFound: result.totalFound,
          processedCount: result.processedCount,
          categoryUsed: {
            id: defaultCategory.id,
            name: defaultCategory.name,
          },
          filters: {
            days,
          },
        },
      })
    } catch (error) {
      console.error('Error getting MercadoPago expense payments:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get MercadoPago expense payments',
        code: 'MP_EXPENSES_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }),
}