import { prisma } from './database.service'
import { Category, Prisma } from '@prisma/client'
import { z } from 'zod'

// Schemas de validación
const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  parentId: z.string().cuid().optional(),
})

const CategoryUpdateSchema = CategoryCreateSchema.partial()

export class CategoryService {
  async create(userId: string, data: z.infer<typeof CategoryCreateSchema>): Promise<Category & { parent: Category | null; children: Category[] }> {
    // Validar datos
    const validatedData = CategoryCreateSchema.parse(data)
    
    // Si se especifica un parent, verificar que existe y pertenece al usuario
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: validatedData.parentId,
          OR: [
            { userId: userId },
            { userId: null }
          ],
          type: validatedData.type // El padre debe ser del mismo tipo
        }
      })

      if (!parentCategory) {
        throw new Error('Parent category not found or not accessible')
      }
    }

    return prisma.category.create({
      data: {
        ...validatedData,
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
    
    // Verificar que la categoría existe y pertenece al usuario (no se pueden editar las globales)
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId }
    })
    
    if (!existingCategory) {
      throw new Error('Category not found or not editable')
    }

    // Si se está actualizando el parent, verificar que existe
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: validatedData.parentId,
          OR: [
            { userId: userId },
            { userId: null }
          ],
          type: validatedData.type || existingCategory.type
        }
      })

      if (!parentCategory) {
        throw new Error('Parent category not found or not accessible')
      }

      // Verificar que no se está creando una referencia circular
      if (validatedData.parentId === id) {
        throw new Error('A category cannot be its own parent')
      }
    }

    return prisma.category.update({
      where: { id },
      data: validatedData,
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
          },
        },
      },
    })
    
    if (!existingCategory) {
      throw new Error('Category not found or not deletable')
    }

    // Verificar que no tiene transacciones asociadas
    if (existingCategory._count.incomes > 0 || existingCategory._count.expenses > 0) {
      throw new Error('Cannot delete category with associated transactions')
    }

    // Verificar que no tiene subcategorías
    if (existingCategory._count.children > 0) {
      throw new Error('Cannot delete category with subcategories')
    }

    return prisma.category.delete({
      where: { id },
    })
  }

  async findByType(userId: string, type: 'INCOME' | 'EXPENSE', includeGlobal = true): Promise<Category[]> {
    return this.findMany(userId, {
      where: { type },
      includeGlobal,
      orderBy: { name: 'asc' },
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
}

export const categoryService = new CategoryService()