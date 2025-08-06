/**
 * Export all category hooks
 */

// Export the backward-compatible hook as the default for existing code
export { useCategories } from './useCategoriesCompat'

// Export all new React Query hooks for gradual migration
export {
  // Query hooks
  useCategoriesQuery,
  useCategoryQuery,
  useSearchCategories,
  useCategoryHierarchy,
  useCategoryStats,
  useCategoryDependencies,
  usePrefetchCategories,
  useCategoryById,
  
  // Mutation hooks
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory
} from './useCategoriesQuery'