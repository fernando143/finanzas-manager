// Tipos base
export interface Category {
  id: string
  name: string
  type: CategoryType
  color?: string
  parentId?: string | null
  userId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CategoryWithRelations extends Category {
  parent?: Category | null
  children?: Category[]
  _count?: {
    incomes: number
    expenses: number
    budgetAllocations?: number
  }
}

export interface CategoryHierarchy extends CategoryWithRelations {
  children: CategoryHierarchy[]
  level: number
  path: string[]
}

// Enums
export const CategoryType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE'
} as const

export type CategoryType = typeof CategoryType[keyof typeof CategoryType]

// DTOs
export interface CategoryCreateDTO {
  name: string
  type: CategoryType
  color?: string
  parentId?: string
}

export interface CategoryUpdateDTO {
  name?: string
  color?: string
  parentId?: string | null
}

// API Responses
export interface CategoryResponse {
  success: boolean
  data?: {
    category?: CategoryWithRelations
    categories?: CategoryWithRelations[]
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  error?: string
  code?: string
  details?: Record<string, unknown>
  message?: string
}

// Estadísticas
export interface CategoryStats {
  categoryId: string
  transactionCount: number
  totalAmount: number
  lastUsed?: string
  trend?: 'up' | 'down' | 'stable'
  percentageOfTotal?: number
  incomeCount: number
  expenseCount: number
  incomeTotal: number
  expenseTotal: number
}

// Dependencies check
export interface CategoryDependencies {
  transactions: number
  subcategories: number
  budgets: number
  canDelete: boolean
}

// Error codes
export const CategoryErrorCode = {
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_IN_USE: 'CATEGORY_IN_USE',
  INVALID_PARENT: 'INVALID_PARENT',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  MAX_DEPTH_EXCEEDED: 'MAX_DEPTH_EXCEEDED',
  TYPE_MISMATCH: 'TYPE_MISMATCH',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_NAME: 'DUPLICATE_NAME'
} as const

export type CategoryErrorCode = typeof CategoryErrorCode[keyof typeof CategoryErrorCode]

// Filter options
export interface CategoryFilterOptions {
  type?: CategoryType | 'ALL'
  includeGlobal?: boolean
  parentId?: string
  searchTerm?: string
}

// Sort options
export interface CategorySortOptions {
  field: 'name' | 'type' | 'createdAt' | 'usage'
  order: 'asc' | 'desc'
}

// View modes
export type CategoryViewMode = 'list' | 'tree' | 'grid'

// Form data
export interface CategoryFormData {
  name: string
  type: CategoryType
  color?: string
  parentId?: string | null
}

// Tree node for hierarchical view
export interface CategoryTreeNode extends CategoryWithRelations {
  expanded?: boolean
  selected?: boolean
  path?: string[]
  level?: number
}

// Color presets
export const COLOR_PRESETS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#A855F7', // purple
]

// Query parameters
export interface CategoryQueryParams {
  page?: number
  limit?: number
  type?: CategoryType
  includeGlobal?: boolean
  parentId?: string
  sort?: 'name' | 'type' | 'createdAt'
  order?: 'asc' | 'desc'
  q?: string // for search endpoint
  search?: string // for main endpoint search
}