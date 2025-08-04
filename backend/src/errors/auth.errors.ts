import { AppError } from '../middleware/error.middleware'

export class AuthenticationError extends Error implements AppError {
  statusCode: number
  code: string

  constructor(message: string = 'Authentication failed', code: string = 'AUTH_ERROR') {
    super(message)
    this.name = 'AuthenticationError'
    this.statusCode = 401
    this.code = code
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode: number
  code: string

  constructor(message: string = 'Access denied', code: string = 'FORBIDDEN') {
    super(message)
    this.name = 'AuthorizationError'
    this.statusCode = 403
    this.code = code
  }
}

export class ValidationError extends Error implements AppError {
  statusCode: number
  code: string

  constructor(message: string = 'Validation failed', code: string = 'VALIDATION_ERROR') {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
    this.code = code
  }
}

export class ConflictError extends Error implements AppError {
  statusCode: number
  code: string

  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT') {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
    this.code = code
  }
}