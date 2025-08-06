/**
 * Legacy useCategories hook - now exports from the React Query implementation
 * This file is kept for backward compatibility
 * New code should import from '@/features/categories/hooks'
 */

// Re-export the React Query implementation with backward compatibility
export { useCategories } from '../../features/categories/hooks/useCategoriesCompat'

// Also export the new React Query hooks for components that want to use them directly
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
} from '../../features/categories/hooks/useCategoriesQuery'
