/**
 * Tests for the migrated categories hooks using React Query
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { 
  useCategoriesQuery, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '../useCategoriesQuery'
import { categoryService } from '../../services/category.service'
import type { CategoryWithRelations, CategoryResponse } from '../../types/category.types'

// Mock the category service
vi.mock('../../services/category.service', () => ({
  categoryService: {
    fetchCategories: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getCategory: vi.fn(),
    search: vi.fn(),
    getHierarchy: vi.fn(),
    getUsageStats: vi.fn(),
    checkDependencies: vi.fn(),
  }
}))

// Mock the auth context
vi.mock('../../../../shared/context/Auth.context', () => ({
  useAuth: () => ({ user: { id: 'test-user', email: 'test@example.com' } })
}))

describe('useCategoriesQuery', () => {
  let queryClient: QueryClient

  // Create wrapper for React Query
  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCategoriesQuery', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories: CategoryWithRelations[] = [
        {
          id: '1',
          name: 'Test Category',
          type: 'INCOME',
          color: '#000000',
          icon: 'icon',
          userId: 'user-1',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          parent: null,
          children: [],
          _count: {
            incomes: 0,
            expenses: 0,
            budgetAllocations: 0
          }
        }
      ]

      const mockResponse: CategoryResponse = {
        success: true,
        data: {
          categories: mockCategories,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1
          }
        }
      }

      vi.mocked(categoryService.fetchCategories).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useCategoriesQuery(), {
        wrapper: createWrapper()
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.categories).toEqual([])

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.categories).toEqual(mockCategories)
      expect(result.current.incomeCategories).toHaveLength(1)
      expect(result.current.expenseCategories).toHaveLength(0)
      expect(categoryService.fetchCategories).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch categories'
      vi.mocked(categoryService.fetchCategories).mockResolvedValue({
        success: false,
        error: errorMessage
      })

      const { result } = renderHook(() => useCategoriesQuery(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.categories).toEqual([])
    })

    it('should filter categories by type', async () => {
      const mockCategories: CategoryWithRelations[] = [
        {
          id: '1',
          name: 'Income Category',
          type: 'INCOME',
          color: '#000000',
          icon: 'icon1',
          userId: 'user-1',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          parent: null,
          children: [],
          _count: { incomes: 0, expenses: 0, budgetAllocations: 0 }
        },
        {
          id: '2',
          name: 'Expense Category',
          type: 'EXPENSE',
          color: '#FFFFFF',
          icon: 'icon2',
          userId: 'user-1',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          parent: null,
          children: [],
          _count: { incomes: 0, expenses: 0, budgetAllocations: 0 }
        }
      ]

      vi.mocked(categoryService.fetchCategories).mockResolvedValue({
        success: true,
        data: { categories: mockCategories }
      })

      const { result } = renderHook(
        () => useCategoriesQuery({ type: 'INCOME' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(categoryService.fetchCategories).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'INCOME' })
      )
    })
  })

  describe('useCreateCategory', () => {
    it('should create category and invalidate queries', async () => {
      const newCategory: CategoryWithRelations = {
        id: 'new-1',
        name: 'New Category',
        type: 'INCOME',
        color: '#00FF00',
        icon: 'new-icon',
        userId: 'user-1',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: null,
        children: [],
        _count: { incomes: 0, expenses: 0, budgetAllocations: 0 }
      }

      vi.mocked(categoryService.create).mockResolvedValue(newCategory)

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper()
      })

      await result.current.mutateAsync({
        name: 'New Category',
        type: 'INCOME',
        color: '#00FF00',
        icon: 'new-icon'
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(categoryService.create).toHaveBeenCalledWith({
        name: 'New Category',
        type: 'INCOME',
        color: '#00FF00',
        icon: 'new-icon'
      })

      expect(result.current.data).toEqual(newCategory)
    })
  })

  describe('useUpdateCategory', () => {
    it('should update category and invalidate queries', async () => {
      const updatedCategory: CategoryWithRelations = {
        id: '1',
        name: 'Updated Category',
        type: 'EXPENSE',
        color: '#FF0000',
        icon: 'updated-icon',
        userId: 'user-1',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: null,
        children: [],
        _count: { incomes: 0, expenses: 0, budgetAllocations: 0 }
      }

      vi.mocked(categoryService.update).mockResolvedValue(updatedCategory)

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper()
      })

      await result.current.mutateAsync({
        id: '1',
        data: {
          name: 'Updated Category',
          type: 'EXPENSE',
          color: '#FF0000',
          icon: 'updated-icon'
        }
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(categoryService.update).toHaveBeenCalledWith('1', {
        name: 'Updated Category',
        type: 'EXPENSE',
        color: '#FF0000',
        icon: 'updated-icon'
      })

      expect(result.current.data).toEqual(updatedCategory)
    })
  })

  describe('useDeleteCategory', () => {
    it('should delete category and invalidate queries', async () => {
      vi.mocked(categoryService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper()
      })

      await result.current.mutateAsync('1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(categoryService.delete).toHaveBeenCalledWith('1')
    })
  })
})