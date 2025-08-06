/**
 * Centralized query keys factory for TanStack React Query
 * Provides a hierarchical, type-safe structure for all query keys
 */

import type { CategoryType } from '../../features/categories/types/category.types'

// Type definitions for query parameters
interface CategoryFilters {
  type?: CategoryType | 'ALL'
  includeGlobal?: boolean
  parentId?: string
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

interface IncomeFilters {
  page?: number
  limit?: number
  categoryId?: string
  startDate?: string
  endDate?: string
  search?: string
}

interface ExpenseFilters {
  page?: number
  limit?: number
  categoryId?: string
  dueDate?: string
  isPaid?: boolean
  startDate?: string
  endDate?: string
  search?: string
}

interface InvestmentFilters {
  page?: number
  limit?: number
  type?: string
  search?: string
}

interface SavingsGoalFilters {
  page?: number
  limit?: number
  type?: 'SHORT' | 'MEDIUM' | 'LONG'
  isCompleted?: boolean
  search?: string
}

interface BudgetFilters {
  page?: number
  limit?: number
  month?: number
  year?: number
  categoryId?: string
}

interface ReportFilters {
  type?: 'income' | 'expense' | 'cashflow' | 'budget'
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month' | 'year'
}

/**
 * Query keys factory with hierarchical structure
 * Each module has its own namespace with consistent patterns
 */
export const queryKeys = {
  // Root key for all API queries
  all: ['api'] as const,
  
  // Categories module
  categories: {
    all: () => [...queryKeys.all, 'categories'] as const,
    lists: () => [...queryKeys.categories.all(), 'list'] as const,
    list: (filters?: CategoryFilters) => 
      [...queryKeys.categories.lists(), { filters }] as const,
    details: () => [...queryKeys.categories.all(), 'detail'] as const,
    detail: (id: string) => 
      [...queryKeys.categories.details(), id] as const,
    hierarchy: (type?: CategoryType) => 
      [...queryKeys.categories.all(), 'hierarchy', { type }] as const,
    stats: (id: string) => 
      [...queryKeys.categories.all(), 'stats', id] as const,
    dependencies: (id: string) => 
      [...queryKeys.categories.all(), 'dependencies', id] as const,
    search: (query: string, includeGlobal?: boolean) => 
      [...queryKeys.categories.all(), 'search', { query, includeGlobal }] as const,
  },
  
  // Incomes module
  incomes: {
    all: () => [...queryKeys.all, 'incomes'] as const,
    lists: () => [...queryKeys.incomes.all(), 'list'] as const,
    list: (filters?: IncomeFilters) => 
      [...queryKeys.incomes.lists(), { filters }] as const,
    infinite: (filters?: Omit<IncomeFilters, 'page'>) => 
      [...queryKeys.incomes.all(), 'infinite', { filters }] as const,
    details: () => [...queryKeys.incomes.all(), 'detail'] as const,
    detail: (id: string) => 
      [...queryKeys.incomes.details(), id] as const,
    summary: (startDate?: string, endDate?: string) => 
      [...queryKeys.incomes.all(), 'summary', { startDate, endDate }] as const,
  },
  
  // Expenses module
  expenses: {
    all: () => [...queryKeys.all, 'expenses'] as const,
    lists: () => [...queryKeys.expenses.all(), 'list'] as const,
    list: (filters?: ExpenseFilters) => 
      [...queryKeys.expenses.lists(), { filters }] as const,
    infinite: (filters?: Omit<ExpenseFilters, 'page'>) => 
      [...queryKeys.expenses.all(), 'infinite', { filters }] as const,
    details: () => [...queryKeys.expenses.all(), 'detail'] as const,
    detail: (id: string) => 
      [...queryKeys.expenses.details(), id] as const,
    dueDates: (month?: number, year?: number) => 
      [...queryKeys.expenses.all(), 'dueDates', { month, year }] as const,
    summary: (startDate?: string, endDate?: string) => 
      [...queryKeys.expenses.all(), 'summary', { startDate, endDate }] as const,
  },
  
  // Investments module
  investments: {
    all: () => [...queryKeys.all, 'investments'] as const,
    lists: () => [...queryKeys.investments.all(), 'list'] as const,
    list: (filters?: InvestmentFilters) => 
      [...queryKeys.investments.lists(), { filters }] as const,
    details: () => [...queryKeys.investments.all(), 'detail'] as const,
    detail: (id: string) => 
      [...queryKeys.investments.details(), id] as const,
    portfolio: () => 
      [...queryKeys.investments.all(), 'portfolio'] as const,
    performance: (startDate?: string, endDate?: string) => 
      [...queryKeys.investments.all(), 'performance', { startDate, endDate }] as const,
  },
  
  // Savings Goals module
  savingsGoals: {
    all: () => [...queryKeys.all, 'savingsGoals'] as const,
    lists: () => [...queryKeys.savingsGoals.all(), 'list'] as const,
    list: (filters?: SavingsGoalFilters) => 
      [...queryKeys.savingsGoals.lists(), { filters }] as const,
    details: () => [...queryKeys.savingsGoals.all(), 'detail'] as const,
    detail: (id: string) => 
      [...queryKeys.savingsGoals.details(), id] as const,
    progress: (id: string) => 
      [...queryKeys.savingsGoals.all(), 'progress', id] as const,
  },
  
  // Budgets module
  budgets: {
    all: () => [...queryKeys.all, 'budgets'] as const,
    lists: () => [...queryKeys.budgets.all(), 'list'] as const,
    list: (filters?: BudgetFilters) => 
      [...queryKeys.budgets.lists(), { filters }] as const,
    details: () => [...queryKeys.budgets.all(), 'detail'] as const,
    detail: (id: string) => 
      [...queryKeys.budgets.details(), id] as const,
    current: () => 
      [...queryKeys.budgets.all(), 'current'] as const,
    allocations: (budgetId: string) => 
      [...queryKeys.budgets.all(), 'allocations', budgetId] as const,
  },
  
  // Reports module
  reports: {
    all: () => [...queryKeys.all, 'reports'] as const,
    cashflow: (filters?: ReportFilters) => 
      [...queryKeys.reports.all(), 'cashflow', { filters }] as const,
    categories: (filters?: ReportFilters) => 
      [...queryKeys.reports.all(), 'categories', { filters }] as const,
    trends: (filters?: ReportFilters) => 
      [...queryKeys.reports.all(), 'trends', { filters }] as const,
    budgetComparison: (month?: number, year?: number) => 
      [...queryKeys.reports.all(), 'budgetComparison', { month, year }] as const,
  },
  
  // User module
  user: {
    all: () => [...queryKeys.all, 'user'] as const,
    current: () => [...queryKeys.user.all(), 'current'] as const,
    profile: () => [...queryKeys.user.all(), 'profile'] as const,
    preferences: () => [...queryKeys.user.all(), 'preferences'] as const,
  },
} as const

/**
 * Helper function to invalidate all queries for a specific module
 */
export function getModuleQueryKey(module: keyof typeof queryKeys) {
  if (module === 'all') return queryKeys.all
  return queryKeys[module].all()
}

/**
 * Helper function to invalidate specific list queries
 */
export function getListQueryKey(module: keyof Omit<typeof queryKeys, 'all' | 'user'>) {
  return queryKeys[module].lists()
}