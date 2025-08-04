import { prisma } from './database.service'
import { SavingsGoal, Prisma } from '@prisma/client'
import { z } from 'zod'

// Schemas de validación
const SavingsGoalCreateSchema = z.object({
  name: z.string().min(1).max(200),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().datetime(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  timeframe: z.enum(['SHORT', 'MEDIUM', 'LONG']),
})

const SavingsGoalUpdateSchema = SavingsGoalCreateSchema.partial()

export class SavingsGoalService {
  async create(userId: string, data: z.infer<typeof SavingsGoalCreateSchema>): Promise<SavingsGoal> {
    // Validar datos
    const validatedData = SavingsGoalCreateSchema.parse(data)
    
    return prisma.savingsGoal.create({
      data: {
        ...validatedData,
        targetDate: new Date(validatedData.targetDate),
        userId,
      },
    })
  }

  async findMany(userId: string, options?: {
    skip?: number
    take?: number
    where?: Prisma.SavingsGoalWhereInput
    orderBy?: Prisma.SavingsGoalOrderByWithRelationInput
  }): Promise<SavingsGoal[]> {
    return prisma.savingsGoal.findMany({
      where: {
        userId,
        ...options?.where,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { targetDate: 'asc' },
    })
  }

  async findById(userId: string, id: string): Promise<SavingsGoal | null> {
    return prisma.savingsGoal.findFirst({
      where: { id, userId },
    })
  }

  async update(userId: string, id: string, data: z.infer<typeof SavingsGoalUpdateSchema>): Promise<SavingsGoal> {
    const validatedData = SavingsGoalUpdateSchema.parse(data)
    
    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await this.findById(userId, id)
    if (!existingGoal) {
      throw new Error('Savings goal not found')
    }

    return prisma.savingsGoal.update({
      where: { id },
      data: {
        ...validatedData,
        targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : undefined,
      },
    })
  }

  async delete(userId: string, id: string): Promise<SavingsGoal> {
    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await this.findById(userId, id)
    if (!existingGoal) {
      throw new Error('Savings goal not found')
    }

    return prisma.savingsGoal.delete({
      where: { id },
    })
  }

  async updateProgress(userId: string, id: string, amount: number): Promise<SavingsGoal> {
    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await this.findById(userId, id)
    if (!existingGoal) {
      throw new Error('Savings goal not found')
    }

    const newAmount = Math.max(0, Math.min(existingGoal.targetAmount.toNumber(), amount))

    return prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: newAmount },
    })
  }

  async addProgress(userId: string, id: string, amount: number): Promise<SavingsGoal> {
    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await this.findById(userId, id)
    if (!existingGoal) {
      throw new Error('Savings goal not found')
    }

    const newAmount = Math.min(
      existingGoal.targetAmount.toNumber(),
      existingGoal.currentAmount.toNumber() + amount
    )

    return prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: newAmount },
    })
  }

  async getProgress(userId: string, id: string) {
    const goal = await this.findById(userId, id)
    if (!goal) {
      throw new Error('Savings goal not found')
    }

    const progress = (goal.currentAmount.toNumber() / goal.targetAmount.toNumber()) * 100
    const remaining = goal.targetAmount.toNumber() - goal.currentAmount.toNumber()
    const daysRemaining = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...goal,
      progress: Math.round(progress * 100) / 100,
      remaining,
      daysRemaining,
      isCompleted: progress >= 100,
      isOverdue: new Date() > goal.targetDate && progress < 100,
    }
  }

  async getSummary(userId: string): Promise<{ totalGoals: number; totalTarget: number; totalCurrent: number; totalProgress: number; completed: number; overdue: number; byTimeframe: { short: number; medium: number; long: number }; byPriority: { low: number; medium: number; high: number } }> {
    const goals = await this.findMany(userId)
    
    const totalTargetAmount = goals.reduce((sum: number, goal: SavingsGoal) => sum + goal.targetAmount.toNumber(), 0)
    const totalCurrentAmount = goals.reduce((sum: number, goal: SavingsGoal) => sum + goal.currentAmount.toNumber(), 0)
    const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0
    
    const completed = goals.filter((goal: SavingsGoal) => 
      goal.currentAmount.toNumber() >= goal.targetAmount.toNumber()
    ).length
    
    const overdue = goals.filter((goal: SavingsGoal) => 
      new Date() > goal.targetDate && 
      goal.currentAmount.toNumber() < goal.targetAmount.toNumber()
    ).length

    const byPriority = {
      high: goals.filter((g: SavingsGoal) => g.priority === 'HIGH').length,
      medium: goals.filter((g: SavingsGoal) => g.priority === 'MEDIUM').length,
      low: goals.filter((g: SavingsGoal) => g.priority === 'LOW').length,
    }

    const byTimeframe = {
      short: goals.filter((g: SavingsGoal) => g.timeframe === 'SHORT').length,
      medium: goals.filter((g: SavingsGoal) => g.timeframe === 'MEDIUM').length,
      long: goals.filter((g: SavingsGoal) => g.timeframe === 'LONG').length,
    }

    return {
      totalGoals: goals.length,
      totalTarget: totalTargetAmount,
      totalCurrent: totalCurrentAmount,
      totalProgress: Math.round(totalProgress * 100) / 100,
      completed,
      overdue,
      byPriority,
      byTimeframe,
    }
  }

  async search(userId: string, query: string): Promise<SavingsGoal[]> {
    return prisma.savingsGoal.findMany({
      where: {
        userId,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { targetDate: 'asc' },
    })
  }
}

export const savingsGoalService = new SavingsGoalService()