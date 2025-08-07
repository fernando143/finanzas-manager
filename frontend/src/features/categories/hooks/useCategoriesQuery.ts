/**
 * Categories hook using TanStack React Query
 * Replaces the manual state management with React Query's powerful caching and synchronization
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/context/Auth.context'
import { categoryService } from '../services/category.service'
import { queryKeys } from '../../../shared/lib/query-keys'
import type { 
  CategoryWithRelations, 
  CategoryCreateDTO, 
  CategoryUpdateDTO, 
  CategoryType,
  CategoryResponse,
  CategoryQueryParams,
  CategoryStats,
  CategoryDependencies
} from '../types/category.types'
import type { CustomQueryOptions, CustomMutationOptions } from '../../../shared/types/react-query.types'

/**
 * Hook options matching the original implementation
 */
interface UseCategoriesOptions {
  type?: CategoryType | 'ALL'
  includeGlobal?: boolean
  parentId?: string
  page?: number
  limit?: number
  search?: string
  queryOptions?: CustomQueryOptions<CategoryResponse>
}

/**
 * Main categories query hook
 * Fetches categories with automatic caching and background refetching
 */
export function useCategoriesQuery(options?: UseCategoriesOptions) {
  const params: CategoryQueryParams = {
    type: options?.type !== 'ALL' ? options?.type : undefined,
    includeGlobal: options?.includeGlobal !== false, // Default to true
    parentId: options?.parentId,
    page: options?.page || 1,
    limit: options?.limit || 20,
    search: options?.search
  }

  const query = useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: async () => {
      const response = await categoryService.fetchCategories(params)
      if (!response.success) {
        throw new Error(response.error || 'Error al obtener categorías')
      }
      return response
    },
    ...options?.queryOptions
  })

  // Extract categories with proper typing
  const categories = query.data?.data?.categories || []
  const pagination = query.data?.data?.pagination || null
  
  // Filtered categories by type (computed values)
  const incomeCategories = categories.filter(cat => cat.type === 'INCOME')
  const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE')

  return {
    ...query,
    categories,
    incomeCategories,
    expenseCategories,
    pagination,
    // Alias common properties for backward compatibility
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    refreshCategories: query.refetch
  }
}

/**
 * Category detail query hook
 * Fetches a single category by ID
 */
export function useCategoryQuery(
  id: string, 
  includeGlobal = true,
  options?: CustomQueryOptions<CategoryWithRelations | null>
) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoryService.getCategory(id, includeGlobal),
    enabled: !!id,
    ...options
  })
}

/**
 * Create category mutation hook
 * Automatically invalidates the categories list on success
 */
export function useCreateCategory(
  options?: CustomMutationOptions<CategoryWithRelations, Error, CategoryCreateDTO>
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: CategoryCreateDTO) => {
      if (!user) {
        throw new Error('Usuario no autenticado para crear categorías')
      }
      return categoryService.create(data)
    },
    onSuccess: (newCategory) => {
      // Invalidate all category lists to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.lists()
      })
      
      // Optionally add the new category to the cache immediately
      queryClient.setQueryData(
        queryKeys.categories.detail(newCategory.id),
        newCategory
      )
    },
    ...options
  })
}

/**
 * Update category mutation hook
 * Automatically invalidates the affected queries on success
 */
export function useUpdateCategory(
  options?: CustomMutationOptions<
    CategoryWithRelations, 
    Error, 
    { id: string; data: CategoryUpdateDTO }
  >
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (!user) {
        throw new Error('Usuario no autenticado para actualizar categorías')
      }
      return categoryService.update(id, data)
    },
    onSuccess: (updatedCategory) => {
      // Invalidate the specific category detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.detail(updatedCategory.id)
      })
      
      // Invalidate all category lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.lists()
      })
      
      // Update the cache with the new data
      queryClient.setQueryData(
        queryKeys.categories.detail(updatedCategory.id),
        updatedCategory
      )
    },
    ...options
  })
}

/**
 * Delete category mutation hook
 * Automatically invalidates the categories list on success
 */
export function useDeleteCategory(
  options?: CustomMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('Usuario no autenticado para eliminar categorías')
      }
      await categoryService.delete(id)
    },
    onSuccess: (_, deletedId) => {
      // Remove the category from the detail cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.categories.detail(deletedId)
      })
      
      // Invalidate all category lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.lists()
      })
    },
    ...options
  })
}

/**
 * Search categories query hook
 * Provides search functionality with caching
 */
export function useSearchCategories(
  query: string,
  includeGlobal = true,
  options?: CustomQueryOptions<CategoryWithRelations[]>
) {
  return useQuery({
    queryKey: queryKeys.categories.search(query, includeGlobal),
    queryFn: () => categoryService.search(query, includeGlobal),
    enabled: !!query && query.length > 0,
    ...options
  })
}

/**
 * Category hierarchy query hook
 * Fetches the category tree structure
 */
export function useCategoryHierarchy(
  type?: CategoryType,
  includeGlobal = true,
  options?: CustomQueryOptions<CategoryWithRelations[]>
) {
  return useQuery({
    queryKey: queryKeys.categories.hierarchy(type),
    queryFn: () => categoryService.getHierarchy(type, includeGlobal),
    ...options
  })
}

/**
 * Category statistics query hook
 * Fetches usage statistics for a specific category
 */
export function useCategoryStats(
  categoryId: string,
  options?: CustomQueryOptions<CategoryStats>
) {
  return useQuery({
    queryKey: queryKeys.categories.stats(categoryId),
    queryFn: () => categoryService.getUsageStats(categoryId),
    enabled: !!categoryId,
    ...options
  })
}

/**
 * Category dependencies query hook
 * Checks dependencies before deletion
 */
export function useCategoryDependencies(
  categoryId: string,
  options?: CustomQueryOptions<CategoryDependencies>
) {
  return useQuery({
    queryKey: queryKeys.categories.dependencies(categoryId),
    queryFn: () => categoryService.checkDependencies(categoryId),
    enabled: !!categoryId,
    ...options
  })
}

/**
 * Prefetch categories helper
 * Useful for preloading data before navigation
 */
export function usePrefetchCategories() {
  const queryClient = useQueryClient()
  
  return async (params?: CategoryQueryParams) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.categories.list(params),
      queryFn: () => categoryService.fetchCategories(params)
    })
  }
}

/**
 * Helper hook to get a category by ID from the cache
 * Falls back to fetching if not in cache
 */
export function useCategoryById(id: string) {
  const { categories } = useCategoriesQuery()
  const cachedCategory = categories.find(cat => cat.id === id)
  
  const { data: fetchedCategory } = useCategoryQuery(
    id,
    true,
    { enabled: !cachedCategory }
  )
  
  return cachedCategory || fetchedCategory || undefined
}