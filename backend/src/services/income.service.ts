import { prisma } from './database.service'
import { Prisma } from '../generated/prisma'
import { z } from 'zod'

// Schemas de validación
const IncomeCreateSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string().min(1), // Changed from cuid() to accept existing category ID format
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']),
  incomeDate: z.string().datetime(),
  nextDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
})

const IncomeUpdateSchema = IncomeCreateSchema.partial()

export class IncomeService {
  async create(userId: string, data: z.infer<typeof IncomeCreateSchema>): Promise<Income> {
    // Validar datos
    const validatedData = IncomeCreateSchema.parse(data)
    
    // Verificar que la categoría existe y pertenece al usuario o es global
    const category = await prisma.category.findFirst({
      where: {
        id: validatedData.categoryId,
        OR: [
          { userId: userId },
          { userId: null } // Categoría global
        ],
        type: 'INCOME'
      }
    })

    if (!category) {
      throw new Error('Category not found or not accessible')
    }

    return prisma.income.create({
      data: {
        ...validatedData,
        incomeDate: new Date(validatedData.incomeDate),
        nextDate: validatedData.nextDate ? new Date(validatedData.nextDate) : null,
        userId,
      },
      include: {
        category: true,
      },
    })
  }

  async findMany(userId: string, options?: {
    skip?: number
    take?: number
    where?: Prisma.IncomeWhereInput
    orderBy?: Prisma.IncomeOrderByWithRelationInput
  }): Promise<(Income & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } })[]> {
    return prisma.income.findMany({
      where: {
        userId,
        ...options?.where,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { incomeDate: 'desc' },
      include: {
        category: true,
      },
    })
  }

  async findById(userId: string, id: string): Promise<(Income & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } }) | null> {
    return prisma.income.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    })
  }

  async update(userId: string, id: string, data: z.infer<typeof IncomeUpdateSchema>): Promise<Income> {
    const validatedData = IncomeUpdateSchema.parse(data)
    
    // Verificar que el ingreso existe y pertenece al usuario
    const existingIncome = await this.findById(userId, id)
    if (!existingIncome) {
      throw new Error('Income not found')
    }

    // Si se está actualizando la categoría, verificar que existe
    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          OR: [
            { userId: userId },
            { userId: null }
          ],
          type: 'INCOME'
        }
      })

      if (!category) {
        throw new Error('Category not found or not accessible')
      }
    }

    return prisma.income.update({
      where: { id },
      data: {
        ...validatedData,
        incomeDate: validatedData.incomeDate ? new Date(validatedData.incomeDate) : undefined,
        nextDate: validatedData.nextDate ? new Date(validatedData.nextDate) : undefined,
      },
      include: {
        category: true,
      },
    })
  }

  async delete(userId: string, id: string): Promise<Income> {
    // Verificar que el ingreso existe y pertenece al usuario
    const existingIncome = await this.findById(userId, id)
    if (!existingIncome) {
      throw new Error('Income not found')
    }

    return prisma.income.delete({
      where: { id },
    })
  }

  async count(userId: string, where?: Prisma.IncomeWhereInput): Promise<number> {
    return prisma.income.count({
      where: {
        userId,
        ...where,
      },
    })
  }

  async aggregate(userId: string, where?: Prisma.IncomeWhereInput): Promise<{ _sum: { amount: number | null }; _avg: { amount: number | null }; _count: number }> {
    return prisma.income.aggregate({
      where: {
        userId,
        ...where,
      },
      _sum: {
        amount: true,
      },
      _avg: {
        amount: true,
      },
      _count: true,
    })
  }

  // Buscar ingresos por texto
  async search(userId: string, query: string): Promise<(Income & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } })[]> {
    return prisma.income.findMany({
      where: {
        userId,
        OR: [
          { description: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        category: true,
      },
      orderBy: { incomeDate: 'desc' },
    })
  }
}

export const incomeService = new IncomeService()