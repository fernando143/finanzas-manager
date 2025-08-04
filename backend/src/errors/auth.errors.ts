import { AppError } from '../middleware/error.middleware'

export class AuthenticationError extends Error implements AppError {
  statusCode: number
  code: string

  constructor(message = 'Authentication failed', code = 'AUTH_ERROR') {
    super(message)
    this.name = 'AuthenticationError'
    this.statusCode = 401
    this.code = code
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode: number
  code: string

  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(message)
    this.name = 'AuthorizationError'
    this.statusCode = 403
    this.code = code
  }
}

export class ValidationError extends Error implements AppError {
  statusCode: number
  code: string

  constructor(message = 'Validation failed', code = 'VALIDATION_ERROR') {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
    this.code = code
  }
}

export class ConflictError extends Error implements AppError {
  statusCode: number
  code: string

  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
    this.code = code
  }
}