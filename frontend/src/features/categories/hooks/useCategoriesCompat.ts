/**
 * Backward-compatible wrapper for the migrated categories hook
 * Provides the same interface as the original useCategories hook
 * This allows for gradual migration of components
 */

import { useCallback } from 'react'
import { 
  useCategoriesQuery, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory
} from './useCategoriesQuery'
import type { 
  CategoryWithRelations, 
  CategoryCreateDTO, 
  CategoryUpdateDTO, 
  CategoryType 
} from '../types/category.types'

interface UseCategoriesOptions {
  type?: CategoryType | 'ALL'
  includeGlobal?: boolean
  parentId?: string
  page?: number
  limit?: number
  search?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UseCategoriesReturn {
  categories: CategoryWithRelations[]
  incomeCategories: CategoryWithRelations[]
  expenseCategories: CategoryWithRelations[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo | null
  fetchCategories: (page?: number, limit?: number, search?: string) => Promise<void>
  createCategory: (category: CategoryCreateDTO) => Promise<CategoryWithRelations | null>
  updateCategory: (id: string, category: CategoryUpdateDTO) => Promise<CategoryWithRelations | null>
  deleteCategory: (id: string) => Promise<boolean>
  refreshCategories: () => Promise<void>
  getCategoryById: (id: string) => CategoryWithRelations | undefined
  searchCategories: (query: string) => Promise<CategoryWithRelations[]>
}

/**
 * Backward-compatible categories hook
 * Maintains the exact same interface as the original hook
 * Uses React Query under the hood for improved performance
 */
export const useCategories = (options?: UseCategoriesOptions): UseCategoriesReturn => {
  // Main query for fetching categories
  const {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    error,
    pagination,
    refetch
  } = useCategoriesQuery(options)

  // Mutations
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  // Fetch categories with parameters
  const fetchCategories = useCallback(async (
    _page?: number, 
    _limit?: number, 
    _search?: string
  ) => {
    // Since React Query handles this automatically with query keys,
    // we just trigger a refetch. The component should be using the
    // options prop to control the query parameters
    await refetch()
  }, [refetch])

  // Create category with promise interface
  const createCategory = useCallback(async (
    categoryData: CategoryCreateDTO
  ): Promise<CategoryWithRelations | null> => {
    try {
      const result = await createMutation.mutateAsync(categoryData)
      return result
    } catch (error) {
      console.error('Error creating category:', error)
      return null
    }
  }, [createMutation])

  // Update category with promise interface
  const updateCategory = useCallback(async (
    id: string,
    categoryData: CategoryUpdateDTO
  ): Promise<CategoryWithRelations | null> => {
    try {
      const result = await updateMutation.mutateAsync({ id, data: categoryData })
      return result
    } catch (error) {
      console.error('Error updating category:', error)
      return null
    }
  }, [updateMutation])

  // Delete category with promise interface
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id)
      return true
    } catch (error) {
      console.error('Error deleting category:', error)
      return false
    }
  }, [deleteMutation])

  // Refresh categories
  const refreshCategories = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Get category by ID from current list
  const getCategoryById = useCallback((id: string): CategoryWithRelations | undefined => {
    return categories.find(cat => cat.id === id)
  }, [categories])

  // Search categories
  const searchCategories = useCallback(async (query: string): Promise<CategoryWithRelations[]> => {
    try {
      const { categoryService } = await import('../services/category.service')
      return await categoryService.search(query, options?.includeGlobal !== false)
    } catch (error) {
      console.error('Error searching categories:', error)
      return []
    }
  }, [options?.includeGlobal])

  // Combine loading states from queries and mutations
  const isLoading = loading || 
    createMutation.isPending || 
    updateMutation.isPending || 
    deleteMutation.isPending

  // Combine error states
  const combinedError = error || 
    createMutation.error?.message || 
    updateMutation.error?.message || 
    deleteMutation.error?.message || 
    null

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading: isLoading,
    error: combinedError,
    pagination,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    getCategoryById,
    searchCategories
  }
}

/**
 * Export the new React Query hooks for direct usage
 * Components can gradually migrate to use these directly
 */
export { 
  useCategoriesQuery,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategoryQuery,
  useSearchCategories,
  useCategoryHierarchy,
  useCategoryStats,
  useCategoryDependencies,
  usePrefetchCategories,
  useCategoryById
} from './useCategoriesQuery'