import { Router } from 'express'
import { AuthController } from '../controllers'
import { authMiddleware, validateBody } from '../middleware'
import { z } from 'zod'

const router = Router()

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

// Public routes
router.post('/register', validateBody(RegisterSchema), AuthController.register)
router.post('/login', validateBody(LoginSchema), AuthController.login)

// Protected routes
router.use(authMiddleware) // Apply auth middleware to all routes below

router.get('/me', AuthController.getProfile)
router.put('/me', validateBody(UpdateProfileSchema), AuthController.updateProfile)
router.post('/change-password', validateBody(ChangePasswordSchema), AuthController.changePassword)
router.post('/refresh', AuthController.refreshToken)
router.post('/logout', AuthController.logout)
router.delete('/account', AuthController.deleteAccount)

export default router