import { Prisma } from '@prisma/client'

export type CollectorWhereClause = Prisma.CollectorWhereInput
export type CollectorOrderBy = Prisma.CollectorOrderByWithRelationInput

export interface CollectorCreateData {
  collectorId: string
  name: string
}

export interface CollectorUpdateData {
  name?: string
}

export interface CollectorWithExpenseCount {
  id: string
  collectorId: string
  name: string
  userId: string
  createdAt: Date
  updatedAt: Date
  _count: {
    expenses: number
  }
}