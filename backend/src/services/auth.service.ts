import { prisma } from './database.service'
import { User } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthenticationError, ConflictError } from '../errors/auth.errors'

// Schemas de validación
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).max(100),
})

interface TokenPayload {
  userId: string
  email: string
}

type UserWithoutPassword = Omit<User, 'password'>

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
  private readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

  async register(data: z.infer<typeof RegisterSchema>): Promise<{ user: UserWithoutPassword; token: string }> {
    const validatedData = RegisterSchema.parse(data)

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      throw new ConflictError('User already exists with this email', 'USER_EXISTS')
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, this.BCRYPT_ROUNDS)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Crear cuenta por defecto para el usuario
    await prisma.account.create({
      data: {
        name: 'Cuenta Principal',
        type: 'CHECKING',
        balance: 0,
        currency: 'MXN',
        userId: user.id,
      },
    })

    // Generar token
    const token = this.generateToken({ userId: user.id, email: user.email })

    return {
      user,
      token,
    }
  }

  async login(data: z.infer<typeof LoginSchema>): Promise<{ user: UserWithoutPassword; token: string }> {
    const validatedData = LoginSchema.parse(data)

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Generar token
    const token = this.generateToken({ userId: user.id, email: user.email })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    }
  }

  async changePassword(userId: string, data: z.infer<typeof ChangePasswordSchema>): Promise<{ message: string }> {
    const validatedData = ChangePasswordSchema.parse(data)

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect', 'INVALID_PASSWORD')
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, this.BCRYPT_ROUNDS)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    })

    return { message: 'Password changed successfully' }
  }

  async updateProfile(userId: string, data: { name?: string; email?: string }): Promise<UserWithoutPassword> {
    const updateData: any = {}

    if (data.name) {
      updateData.name = data.name
    }

    if (data.email) {
      // Verificar que el nuevo email no esté en uso
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError('Email already in use', 'EMAIL_IN_USE')
      }

      updateData.email = data.email
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return updatedUser
  }

  async getUserById(userId: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload
      
      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      })

      if (!user) {
        throw new AuthenticationError('User not found', 'USER_NOT_FOUND')
      }

      return decoded
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }
      throw new AuthenticationError('Invalid token', 'INVALID_TOKEN')
    }
  }

  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions)
  }

  async refreshToken(userId: string): Promise<{ token: string }> {
    const user = await this.getUserById(userId)
    
    if (!user) {
      throw new Error('User not found')
    }
    
    const token = this.generateToken({ 
      userId: user.id, 
      email: user.email 
    })

    return { token }
  }

  async deleteAccount(userId: string, password: string): Promise<{ message: string }> {
    // Verificar contraseña antes de eliminar
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid password', 'INVALID_PASSWORD')
    }

    // Eliminar usuario (cascade eliminará todos los datos relacionados)
    await prisma.user.delete({
      where: { id: userId },
    })

    return { message: 'Account deleted successfully' }
  }
}

export const authService = new AuthService()