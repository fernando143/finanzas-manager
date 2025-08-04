import { Response } from 'express'
import { z } from 'zod'
import { authService } from '../services'
import { AuthenticatedRequest, asyncHandler } from '../middleware'

// Validation schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).max(100),
})

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
})

export const AuthController = {
  // POST /api/auth/register
  register: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = RegisterSchema.parse(req.body)
    
    const result = await authService.register(validatedData)
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    })
  }),

  // POST /api/auth/login
  login: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = LoginSchema.parse(req.body)
    
    const result = await authService.login(validatedData)
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    })
  }),

  // GET /api/auth/me
  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    
    const user = await authService.getUserById(userId)
    
    res.status(200).json({
      success: true,
      data: { user },
    })
  }),

  // PUT /api/auth/me
  updateProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = UpdateProfileSchema.parse(req.body)
    const userId = req.user!.userId
    
    const user = await authService.updateProfile(userId, validatedData)
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    })
  }),

  // POST /api/auth/change-password
  changePassword: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = ChangePasswordSchema.parse(req.body)
    const userId = req.user!.userId
    
    const result = await authService.changePassword(userId, validatedData)
    
    res.status(200).json({
      success: true,
      message: result.message,
    })
  }),

  // POST /api/auth/refresh
  refreshToken: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId
    
    const result = await authService.refreshToken(userId)
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    })
  }),

  // DELETE /api/auth/account
  deleteAccount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { password } = req.body
    const userId = req.user!.userId
    
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Password is required',
        code: 'MISSING_PASSWORD',
      })
    }
    
    const result = await authService.deleteAccount(userId, password)
    
    res.status(200).json({
      success: true,
      message: result.message,
    })
  }),

  // POST /api/auth/logout
  logout: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // En JWT stateless, el logout se maneja en el cliente
    // Aquí podríamos agregar el token a una blacklist si fuera necesario
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    })
  }),
}