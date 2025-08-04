import { prisma } from './database.service'
import { Prisma } from '../generated/prisma'
import { z } from 'zod'

// Schemas de validación
const ExpenseCreateSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string(), // Simplified validation to debug CUID issue
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']).default('PENDING'),
})

const ExpenseUpdateSchema = ExpenseCreateSchema.partial()

export class ExpenseService {
  async create(userId: string, data: z.infer<typeof ExpenseCreateSchema>): Promise<Expense> {
    // Validar datos
    const validatedData = ExpenseCreateSchema.parse(data)
    
    // Verificar que la categoría existe y pertenece al usuario o es global
    const category = await prisma.category.findFirst({
      where: {
        id: validatedData.categoryId,
        OR: [
          { userId: userId },
          { userId: null } // Categoría global
        ],
        type: 'EXPENSE'
      }
    })

    if (!category) {
      throw new Error('Category not found or not accessible')
    }

    return prisma.expense.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
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
    where?: Prisma.ExpenseWhereInput
    orderBy?: Prisma.ExpenseOrderByWithRelationInput
  }): Promise<(Expense & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } })[]> {
    return prisma.expense.findMany({
      where: {
        userId,
        ...options?.where,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { dueDate: 'asc' },
      include: {
        category: true,
      },
    })
  }

  async findById(userId: string, id: string): Promise<(Expense & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } }) | null> {
    return prisma.expense.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    })
  }

  async update(userId: string, id: string, data: z.infer<typeof ExpenseUpdateSchema>): Promise<Expense> {
    const validatedData = ExpenseUpdateSchema.parse(data)
    
    // Verificar que el gasto existe y pertenece al usuario
    const existingExpense = await this.findById(userId, id)
    if (!existingExpense) {
      throw new Error('Expense not found')
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
          type: 'EXPENSE'
        }
      })

      if (!category) {
        throw new Error('Category not found or not accessible')
      }
    }

    return prisma.expense.update({
      where: { id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
      include: {
        category: true,
      },
    })
  }

  async delete(userId: string, id: string): Promise<Expense> {
    // Verificar que el gasto existe y pertenece al usuario
    const existingExpense = await this.findById(userId, id)
    if (!existingExpense) {
      throw new Error('Expense not found')
    }

    return prisma.expense.delete({
      where: { id },
    })
  }

  async count(userId: string, where?: Prisma.ExpenseWhereInput): Promise<number> {
    return prisma.expense.count({
      where: {
        userId,
        ...where,
      },
    })
  }

  async aggregate(userId: string, where?: Prisma.ExpenseWhereInput): Promise<{ _sum: { amount: number | null }; _avg: { amount: number | null }; _count: number }> {
    return prisma.expense.aggregate({
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

  // Buscar gastos por texto
  async search(userId: string, query: string): Promise<(Expense & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } })[]> {
    return prisma.expense.findMany({
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
      orderBy: { dueDate: 'asc' },
    })
  }

  // Obtener gastos próximos a vencer
  async findUpcoming(userId: string, days = 7): Promise<(Expense & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } })[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return prisma.expense.findMany({
      where: {
        userId,
        dueDate: {
          gte: new Date(),
          lte: futureDate,
        },
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
      },
      include: {
        category: true,
      },
      orderBy: { dueDate: 'asc' },
    })
  }

  // Obtener gastos vencidos
  async findOverdue(userId: string): Promise<(Expense & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } })[]> {
    return prisma.expense.findMany({
      where: {
        userId,
        dueDate: {
          lt: new Date(),
        },
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
      },
      include: {
        category: true,
      },
      orderBy: { dueDate: 'asc' },
    })
  }
}

export const expenseService = new ExpenseService()