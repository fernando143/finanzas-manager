import { prisma } from './database.service'
import { Category, Prisma } from '@prisma/client'
import { z } from 'zod'

// Custom error class for category operations
export class CategoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'CategoryError'
  }
}

// Error codes
export enum CategoryErrorCode {
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_IN_USE = 'CATEGORY_IN_USE',
  INVALID_PARENT = 'INVALID_PARENT',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  MAX_DEPTH_EXCEEDED = 'MAX_DEPTH_EXCEEDED',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_NAME = 'DUPLICATE_NAME'
}

// Schemas de validación
const CategoryCreateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres').trim(),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color debe ser formato hexadecimal').optional(),
  parentId: z.string().min(1, 'ID de categoría padre inválido').optional().nullable(),
})

const CategoryUpdateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres').trim().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color debe ser formato hexadecimal').optional(),
  parentId: z.string().min(1, 'ID de categoría padre inválido').nullable().optional()
})

export class CategoryService {
  async create(userId: string, data: z.infer<typeof CategoryCreateSchema>): Promise<Category & { parent: Category | null; children: Category[] }> {
    // Validar datos
    const validatedData = CategoryCreateSchema.parse(data)
    
    // Clean up parentId - convert empty string or null to undefined
    const cleanData = { ...validatedData }
    if (cleanData.parentId === '' || cleanData.parentId === null) {
      delete (cleanData as any).parentId
    }
    
    // Verificar unicidad del nombre dentro del alcance del usuario y tipo
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: validatedData.name,
        type: validatedData.type,
        OR: [
          { userId: userId },
          { userId: null }
        ]
      }
    })

    if (existingCategory) {
      throw new CategoryError(
        'Ya existe una categoría con este nombre',
        CategoryErrorCode.DUPLICATE_NAME,
        400
      )
    }
    
    // Si se especifica un parent, verificar que existe y validar jerarquía
    if (cleanData.parentId) {
      await this.validateHierarchy(userId, cleanData.parentId, undefined, cleanData.type)
    }

    return prisma.category.create({
      data: {
        ...cleanData,
        userId,
      },
      include: {
        parent: true,
        children: true,
      },
    })
  }

  async findMany(userId: string, options?: {
    skip?: number
    take?: number
    where?: Prisma.CategoryWhereInput
    orderBy?: Prisma.CategoryOrderByWithRelationInput
    includeGlobal?: boolean
  }): Promise<(Category & { parent: Category | null; children: Category[] })[]> {
    const whereClause: Prisma.CategoryWhereInput = {
      OR: [
        { userId: userId },
        ...(options?.includeGlobal !== false ? [{ userId: null }] : [])
      ],
      ...options?.where,
    }

    return prisma.category.findMany({
      where: whereClause,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { name: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            incomes: true,
            expenses: true,
          },
        },
      },
    })
  }

  async count(userId: string, options?: {
    where?: Prisma.CategoryWhereInput
    includeGlobal?: boolean
  }): Promise<number> {
    const whereClause: Prisma.CategoryWhereInput = {
      OR: [
        { userId: userId },
        ...(options?.includeGlobal !== false ? [{ userId: null }] : [])
      ],
      ...options?.where,
    }

    return prisma.category.count({
      where: whereClause,
    })
  }

  async findById(userId: string, id: string, includeGlobal = true): Promise<(Category & { parent: Category | null; children: Category[] }) | null> {
    const whereClause: Prisma.CategoryWhereInput = {
      id,
      OR: [
        { userId: userId },
        ...(includeGlobal ? [{ userId: null }] : [])
      ],
    }

    return prisma.category.findFirst({
      where: whereClause,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            incomes: true,
            expenses: true,
          },
        },
      },
    })
  }

  async update(userId: string, id: string, data: z.infer<typeof CategoryUpdateSchema>): Promise<Category & { parent: Category | null; children: Category[] }> {
    const validatedData = CategoryUpdateSchema.parse(data)
    
    // Clean up parentId - convert empty string to null
    const cleanData = { ...validatedData }
    if (cleanData.parentId === '') {
      cleanData.parentId = null
    }
    
    // Verificar que la categoría existe y pertenece al usuario (no se pueden editar las globales)
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId }
    })
    
    if (!existingCategory) {
      throw new CategoryError(
        'Categoría no encontrada o no editable',
        CategoryErrorCode.CATEGORY_NOT_FOUND,
        404
      )
    }

    // Verificar unicidad del nombre si se está actualizando
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateName = await prisma.category.findFirst({
        where: {
          name: validatedData.name,
          type: existingCategory.type,
          id: { not: id },
          OR: [
            { userId: userId },
            { userId: null }
          ]
        }
      })

      if (duplicateName) {
        throw new CategoryError(
          'Ya existe una categoría con este nombre',
          CategoryErrorCode.DUPLICATE_NAME,
          400
        )
      }
    }

    // Si se está actualizando el parent, validar jerarquía
    if (cleanData.parentId !== undefined) {
      if (cleanData.parentId) {
        await this.validateHierarchy(userId, cleanData.parentId, id, existingCategory.type)
      }
    }

    return prisma.category.update({
      where: { id },
      data: cleanData,
      include: {
        parent: true,
        children: true,
      },
    })
  }

  async delete(userId: string, id: string): Promise<Category> {
    // Verificar que la categoría existe y pertenece al usuario
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            incomes: true,
            expenses: true,
            children: true,
            budgetAllocations: true,
          },
        },
      },
    })
    
    if (!existingCategory) {
      throw new CategoryError(
        'Categoría no encontrada o no eliminable',
        CategoryErrorCode.CATEGORY_NOT_FOUND,
        404
      )
    }

    // Verificar que no tiene transacciones asociadas
    if (existingCategory._count.incomes > 0 || existingCategory._count.expenses > 0) {
      throw new CategoryError(
        `La categoría tiene ${existingCategory._count.incomes + existingCategory._count.expenses} transacciones asociadas`,
        CategoryErrorCode.CATEGORY_IN_USE,
        400,
        {
          incomes: existingCategory._count.incomes,
          expenses: existingCategory._count.expenses
        }
      )
    }

    // Verificar que no tiene subcategorías
    if (existingCategory._count.children > 0) {
      throw new CategoryError(
        `La categoría tiene ${existingCategory._count.children} subcategorías`,
        CategoryErrorCode.CATEGORY_IN_USE,
        400,
        { subcategories: existingCategory._count.children }
      )
    }

    // Verificar que no está en uso en presupuestos
    if (existingCategory._count.budgetAllocations > 0) {
      throw new CategoryError(
        `La categoría está en uso en ${existingCategory._count.budgetAllocations} presupuestos`,
        CategoryErrorCode.CATEGORY_IN_USE,
        400,
        { budgets: existingCategory._count.budgetAllocations }
      )
    }

    return prisma.category.delete({
      where: { id },
    })
  }

  async search(userId: string, query: string, includeGlobal = true): Promise<(Category & { parent: Category | null; children: Category[] })[]> {
    const whereClause: Prisma.CategoryWhereInput = {
      OR: [
        { userId: userId },
        ...(includeGlobal ? [{ userId: null }] : [])
      ],
      name: {
        contains: query,
        mode: 'insensitive',
      },
    }

    return prisma.category.findMany({
      where: whereClause,
      include: {
        parent: true,
        children: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  async getHierarchy(userId: string, type?: 'INCOME' | 'EXPENSE', includeGlobal = true) {
    const whereClause: Prisma.CategoryWhereInput = {
      OR: [
        { userId: userId },
        ...(includeGlobal ? [{ userId: null }] : [])
      ],
      parentId: null, // Solo categorías padre
      ...(type ? { type } : {}),
    }

    return prisma.category.findMany({
      where: whereClause,
      include: {
        children: {
          include: {
            children: true, // Hasta 3 niveles de profundidad
          },
        },
        _count: {
          select: {
            incomes: true,
            expenses: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  // Helper methods
  private async validateHierarchy(
    userId: string,
    parentId: string,
    childId?: string,
    childType?: 'INCOME' | 'EXPENSE'
  ): Promise<void> {
    // Verificar que el padre existe
    const parent = await prisma.category.findFirst({
      where: {
        id: parentId,
        OR: [
          { userId: userId },
          { userId: null }
        ]
      },
      include: {
        parent: {
          include: {
            parent: true
          }
        }
      }
    })

    if (!parent) {
      throw new CategoryError(
        'Categoría padre no encontrada',
        CategoryErrorCode.INVALID_PARENT,
        404
      )
    }

    // Verificar consistencia de tipo
    if (childType && parent.type !== childType) {
      throw new CategoryError(
        'El tipo de la categoría padre no coincide con el tipo del hijo',
        CategoryErrorCode.TYPE_MISMATCH,
        400
      )
    }

    // Verificar profundidad máxima (3 niveles)
    let depth = 0
    let currentParent: any = parent
    while (currentParent.parent) {
      depth++
      if (depth >= 2) {
        throw new CategoryError(
          'Se excedió la profundidad máxima de jerarquía (3 niveles)',
          CategoryErrorCode.MAX_DEPTH_EXCEEDED,
          400
        )
      }
      currentParent = currentParent.parent
    }

    // Prevenir referencias circulares si se está actualizando
    if (childId) {
      if (parentId === childId) {
        throw new CategoryError(
          'Una categoría no puede ser su propio padre',
          CategoryErrorCode.CIRCULAR_REFERENCE,
          400
        )
      }

      // Verificar que el nuevo padre no es un descendiente del hijo
      const descendants = await this.getDescendants(childId)
      if (descendants.includes(parentId)) {
        throw new CategoryError(
          'Referencia circular detectada: el padre es un descendiente del hijo',
          CategoryErrorCode.CIRCULAR_REFERENCE,
          400
        )
      }
    }
  }

  private async getDescendants(categoryId: string): Promise<string[]> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        children: {
          include: {
            children: true
          }
        }
      }
    })

    if (!category) return []

    const descendants: string[] = []
    const addDescendants = (cats: any[]) => {
      for (const cat of cats) {
        descendants.push(cat.id)
        if (cat.children) {
          addDescendants(cat.children)
        }
      }
    }

    if (category.children) {
      addDescendants(category.children)
    }

    return descendants
  }

  async getUsageStats(userId: string, categoryId: string) {
    const category = await this.findById(userId, categoryId)
    
    if (!category) {
      throw new CategoryError(
        'Categoría no encontrada',
        CategoryErrorCode.CATEGORY_NOT_FOUND,
        404
      )
    }

    const [incomeStats, expenseStats] = await Promise.all([
      prisma.income.aggregate({
        where: { categoryId },
        _sum: { amount: true },
        _count: true,
        _max: { incomeDate: true }
      }),
      prisma.expense.aggregate({
        where: { categoryId },
        _sum: { amount: true },
        _count: true,
        _max: { createdAt: true }
      })
    ])

    return {
      categoryId,
      transactionCount: (incomeStats._count || 0) + (expenseStats._count || 0),
      totalAmount: Number(incomeStats._sum.amount || 0) + Number(expenseStats._sum.amount || 0),
      lastUsed: incomeStats._max.incomeDate || expenseStats._max.createdAt || null,
      incomeCount: incomeStats._count || 0,
      expenseCount: expenseStats._count || 0,
      incomeTotal: Number(incomeStats._sum.amount || 0),
      expenseTotal: Number(expenseStats._sum.amount || 0)
    }
  }

  async checkDependencies(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            incomes: true,
            expenses: true,
            children: true,
            budgetAllocations: true
          }
        }
      }
    })

    if (!category) {
      throw new CategoryError(
        'Categoría no encontrada',
        CategoryErrorCode.CATEGORY_NOT_FOUND,
        404
      )
    }

    return {
      transactions: category._count.incomes + category._count.expenses,
      subcategories: category._count.children,
      budgets: category._count.budgetAllocations,
      canDelete: (
        category._count.incomes === 0 &&
        category._count.expenses === 0 &&
        category._count.children === 0 &&
        category._count.budgetAllocations === 0
      )
    }
  }
}

export const categoryService = new CategoryService()