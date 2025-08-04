// Auth middleware
export { 
  authMiddleware, 
  optionalAuthMiddleware,
  type AuthenticatedRequest 
} from './auth.middleware'

// Error handling middleware
export { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler,
  type AppError 
} from './error.middleware'

// Validation middleware
export { 
  validateBody, 
  validateQuery, 
  validateParams,
  paginationMiddleware,
  IdParamSchema,
  PaginationQuerySchema,
  SearchQuerySchema 
} from './validation.middleware'