import { prisma } from './database.service'
import { Collector, Prisma } from '@prisma/client'
import { z } from 'zod'
import { CollectorCreateData, CollectorUpdateData, CollectorWithExpenseCount } from '../types'

// Schemas de validación
const CollectorCreateSchema = z.object({
  collectorId: z.string().min(1),
  name: z.string().min(1).max(100),
})

const CollectorUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

export class CollectorService {
  // Crear collector
  async create(userId: string, data: CollectorCreateData): Promise<Collector> {
    const validatedData = CollectorCreateSchema.parse(data)
    
    // Verificar si ya existe un collector con el mismo collectorId
    const existingCollector = await prisma.collector.findUnique({
      where: { collectorId: validatedData.collectorId }
    })
    
    if (existingCollector) {
      // Si existe pero es del mismo usuario, retornarlo
      if (existingCollector.userId === userId) {
        return existingCollector
      }
      // Si es de otro usuario, crear uno con el mismo collectorId pero para este usuario
      // (múltiples usuarios pueden tener el mismo collector de MercadoPago)
    }
    
    return prisma.collector.create({
      data: {
        ...validatedData,
        userId,
      },
    })
  }
  
  // Buscar todos los collectors del usuario
  async findMany(
    userId: string,
    options?: {
      includeExpenseCount?: boolean
      orderBy?: Prisma.CollectorOrderByWithRelationInput
    }
  ): Promise<Collector[] | CollectorWithExpenseCount[]> {
    return prisma.collector.findMany({
      where: { userId },
      orderBy: options?.orderBy || { name: 'asc' },
      include: options?.includeExpenseCount ? {
        _count: {
          select: { expenses: true }
        }
      } : undefined
    })
  }
  
  // Buscar por ID
  async findById(userId: string, id: string): Promise<Collector | null> {
    return prisma.collector.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        _count: {
          select: { expenses: true }
        }
      }
    })
  }
  
  // Buscar por collectorId de MercadoPago
  async findByCollectorId(userId: string, collectorId: string): Promise<Collector | null> {
    return prisma.collector.findFirst({
      where: {
        collectorId,
        userId,
      },
    })
  }
  
  // Actualizar
  async update(userId: string, id: string, data: CollectorUpdateData): Promise<Collector> {
    const validatedData = CollectorUpdateSchema.parse(data)
    
    // Verificar que el collector pertenece al usuario
    const collector = await this.findById(userId, id)
    if (!collector) {
      throw new Error('Collector not found')
    }
    
    return prisma.collector.update({
      where: { id },
      data: validatedData,
    })
  }
  
  // Eliminar (verificar que no tenga expenses)
  async delete(userId: string, id: string): Promise<Collector> {
    // Verificar que el collector pertenece al usuario
    const collector = await this.findById(userId, id)
    if (!collector) {
      throw new Error('Collector not found')
    }
    
    // Verificar que no tenga expenses asociados
    const expenseCount = await this.countExpenses(userId, id)
    if (expenseCount > 0) {
      throw new Error('Cannot delete collector with associated expenses')
    }
    
    return prisma.collector.delete({
      where: { id },
    })
  }
  
  // Obtener o crear (para sincronización)
  async getOrCreate(userId: string, collectorId: string, name?: string): Promise<Collector> {
    // Buscar si ya existe
    const existingCollector = await this.findByCollectorId(userId, collectorId)
    if (existingCollector) {
      return existingCollector
    }
    
    // Si no existe, crear uno nuevo
    return this.create(userId, {
      collectorId,
      name: name || `Collector ${collectorId}`,
    })
  }
  
  // Contar expenses asociados
  async countExpenses(userId: string, id: string): Promise<number> {
    return prisma.expense.count({
      where: {
        collectorId: id,
        userId,
      },
    })
  }
}

export const collectorService = new CollectorService()