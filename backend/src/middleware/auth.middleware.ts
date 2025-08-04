import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided or invalid format.',
        code: 'NO_TOKEN'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = await authService.verifyToken(token)
      req.user = decoded
      next()
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      error: 'Internal server error in authentication.',
      code: 'AUTH_ERROR'
    })
  }
}

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const decoded = await authService.verifyToken(token)
        req.user = decoded
      } catch (error) {
        // Token inválido, pero continuamos sin usuario
        req.user = undefined
      }
    }
    
    next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    next() // Continuamos aunque haya error
  }
}