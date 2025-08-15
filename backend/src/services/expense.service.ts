import { prisma } from './database.service'
import { Expense, Prisma } from '@prisma/client'
import { z } from 'zod'

// Schemas de validación
const ExpenseCreateSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string(), // Simplified validation to debug CUID issue
  frequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME']),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']).default('PENDING'),
  mercadoPagoPaymentId: z.string().optional(),
  collectorId: z.string().optional(),
})

const ExpenseUpdateSchema = ExpenseCreateSchema.partial()

export class ExpenseService {
  async create(userId: string, data: z.infer<typeof ExpenseCreateSchema>): Promise<Expense> {
    // Validar datos
    console.log('Service received data:', data);
    const validatedData = ExpenseCreateSchema.parse(data)
    console.log('Service validated data:', validatedData);
    
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
        mercadoPagoPaymentId: validatedData.mercadoPagoPaymentId || null,
        collectorId: validatedData.collectorId || null,
        userId,
      },
      include: {
        category: true,
        collector: true,
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
        collector: true,
      },
    })
  }

  async findById(userId: string, id: string): Promise<(Expense & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } }) | null> {
    return prisma.expense.findFirst({
      where: { id, userId },
      include: {
        category: true,
        collector: true,
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
        mercadoPagoPaymentId: validatedData.mercadoPagoPaymentId || undefined,
      },
      include: {
        category: true,
        collector: true,
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

  async aggregate(userId: string, where?: Prisma.ExpenseWhereInput) {
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
        collector: true,
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
        collector: true,
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
        collector: true,
      },
      orderBy: { dueDate: 'asc' },
    })
  }

  // Check if expense with MercadoPago payment ID already exists
  async findByMercadoPagoPaymentId(userId: string, mercadoPagoPaymentId: string): Promise<Expense | null> {
    return prisma.expense.findFirst({
      where: {
        userId,
        mercadoPagoPaymentId,
      },
      include: {
        category: true,
        collector: true,
      },
    })
  }

  // Create multiple expenses from MercadoPago payments, avoiding duplicates
  async createFromMercadoPagoPayments(
    userId: string, 
    expensesData: Array<z.infer<typeof ExpenseCreateSchema> & { mercadoPagoPaymentId: string }>
  ): Promise<{
    created: Expense[]
    skipped: string[]
    errors: Array<{ mercadoPagoPaymentId: string; error: string }>
  }> {
    const created: Expense[] = []
    const skipped: string[] = []
    const errors: Array<{ mercadoPagoPaymentId: string; error: string }> = []

    for (const expenseData of expensesData) {
      try {
        // Check if expense with this MercadoPago payment ID already exists
        const existingExpense = await this.findByMercadoPagoPaymentId(userId, expenseData.mercadoPagoPaymentId)
        
        if (existingExpense) {
          skipped.push(expenseData.mercadoPagoPaymentId)
          continue
        }

        // Create new expense
        const newExpense = await this.create(userId, expenseData)
        created.push(newExpense)
      } catch (error) {
        console.error(`Error creating expense from MercadoPago payment ${expenseData.mercadoPagoPaymentId}:`, error)
        errors.push({
          mercadoPagoPaymentId: expenseData.mercadoPagoPaymentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return { created, skipped, errors }
  }

  // Get expenses with MercadoPago integration
  async findManyWithMercadoPago(userId: string, options?: {
    skip?: number
    take?: number
    where?: Prisma.ExpenseWhereInput
    orderBy?: Prisma.ExpenseOrderByWithRelationInput
    includeMercadoPago?: boolean
  }): Promise<(Expense & { category: { id: string; name: string; type: string; parentId: string | null; userId: string | null; createdAt: Date; updatedAt: Date } })[]> {
    const expenses = await this.findMany(userId, options)
    
    if (options?.includeMercadoPago) {
      // Here we could enhance with additional MercadoPago data if needed
      // For now, just return the expenses with the mercadoPagoPaymentId field
      return expenses
    }
    
    return expenses
  }
}

export const expenseService = new ExpenseService()