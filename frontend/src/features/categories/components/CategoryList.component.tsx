import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useCategories } from '../../../shared/hooks/useCategories.hook'
import { CategoryCard } from './CategoryCard.component'
import { CategoryTree } from './CategoryTree.component'
import { CategorySkeleton } from './CategorySkeleton.component'
import { EnhancedPagination } from '../../../shared/ui/components/EnhancedPagination.component'
import type { 
  CategoryWithRelations, 
  CategoryType, 
  CategoryViewMode
} from '../types/category.types'
import { Search, Grid3X3, List, TreePine, X, Loader2 } from 'lucide-react'

interface CategoryListProps {
  type?: CategoryType | 'ALL'
  onEdit: (category: CategoryWithRelations) => void
  onDelete: (category: CategoryWithRelations) => void
  onSelect?: (category: CategoryWithRelations) => void
  onCreateNew?: () => void
}

export const CategoryList: React.FC<CategoryListProps> = ({
  type = 'ALL',
  onEdit,
  onDelete,
  onSelect,
  onCreateNew
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<CategoryViewMode>('list')
  const [filterType, setFilterType] = useState<CategoryType | 'ALL'>(type)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { 
    categories, 
    loading, 
    error,
    pagination,
    fetchCategories,
    refreshCategories
  } = useCategories({ 
    type: filterType, 
    includeGlobal: true,
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchTerm
  })

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    setIsSearching(true)
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when searching
      setIsSearching(false)
    }, searchTerm ? 400 : 0) // 400ms debounce when typing, instant when clearing

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Fetch categories when page, items per page, filter type, or debounced search changes
  useEffect(() => {
    const loadCategories = async () => {
      setIsTransitioning(true)
      await fetchCategories(currentPage, itemsPerPage, debouncedSearchTerm)
      setTimeout(() => setIsTransitioning(false), 200)
    }
    loadCategories()
  }, [currentPage, itemsPerPage, filterType, debouncedSearchTerm, fetchCategories])

  // Handle type filter change
  const handleTypeChange = useCallback((newType: CategoryType | 'ALL') => {
    setFilterType(newType)
    setCurrentPage(1) // Reset to first page when filter changes
  }, [])

  // Handle search clear
  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setCurrentPage(1)
  }, [])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Handle delete with refresh
  const handleDelete = useCallback((category: CategoryWithRelations) => {
    // Call the parent's onDelete handler which will trigger the delete dialog
    onDelete(category)
  }, [onDelete])

  // Initial loading state with skeleton
  if (loading && categories.length === 0) {
    return (
      <div className="category-list space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Gestión de Categorías</h2>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="toolbar bg-white p-4 rounded-lg shadow-sm">
          <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <CategorySkeleton count={itemsPerPage} variant={viewMode === 'tree' ? 'list' : viewMode} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={refreshCategories}
          className="mt-2 text-sm text-red-500 hover:text-red-700 underline"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  return (
    <div className="category-list space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Categorías</h2>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Nueva Categoría
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="toolbar flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar categorías..."
              className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {/* Loading spinner */}
            {isSearching && (
              <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5 animate-spin" />
            )}
            {/* Clear button */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded"
                title="Limpiar búsqueda"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Tipo:</label>
          <select
            value={filterType}
            onChange={(e) => handleTypeChange(e.target.value as CategoryType | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Todas</option>
            <option value="INCOME">Ingresos</option>
            <option value="EXPENSE">Egresos</option>
          </select>
        </div>


        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${
              viewMode === 'list' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vista de lista"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vista de cuadrícula"
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`p-2 rounded ${
              viewMode === 'tree' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vista de árbol"
          >
            <TreePine className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Categories Display */}
      <div className="categories-content relative min-h-[200px]">
        {isTransitioning && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">Cargando categorías...</span>
            </div>
          </div>
        )}
        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-30' : 'opacity-100'}`}>
        {/* Search results header */}
        {debouncedSearchTerm && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Mostrando resultados para: <span className="font-semibold">"{debouncedSearchTerm}"</span>
              {pagination && ` (${pagination.total} categorías encontradas)`}
            </p>
          </div>
        )}
        
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {debouncedSearchTerm 
                ? `No se encontraron categorías que coincidan con "${debouncedSearchTerm}"`
                : 'No hay categorías disponibles'}
            </p>
            {!debouncedSearchTerm && onCreateNew && (
              <button
                onClick={onCreateNew}
                className="mt-4 text-blue-500 hover:text-blue-700 underline"
              >
                Crear primera categoría
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'list' && (
              <CategoryListView
                categories={categories}
                onEdit={onEdit}
                onDelete={handleDelete}
                onSelect={onSelect}
              />
            )}
            {viewMode === 'grid' && (
              <CategoryGridView
                categories={categories}
                onEdit={onEdit}
                onDelete={handleDelete}
                onSelect={onSelect}
              />
            )}
            {viewMode === 'tree' && (
              <CategoryTree
                categories={categories}
                onEdit={onEdit}
                onDelete={handleDelete}
                onSelect={onSelect}
              />
            )}
          </>
        )}
        </div>
      </div>

      {/* Summary and Pagination */}
      <div className="mt-4 space-y-4">
        {/* Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 gap-2">
          <span>
            {pagination && (
              <span>
                Mostrando <span className="font-medium">
                  {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
                </span> - <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> de <span className="font-medium">{pagination.total}</span> categorías
              </span>
            )}
          </span>
          {loading && (
            <span className="text-blue-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Actualizando...
            </span>
          )}
        </div>
        
        {/* Pagination Component */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <EnhancedPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={setItemsPerPage}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// List View Component
const CategoryListView: React.FC<{
  categories: CategoryWithRelations[]
  onEdit: (category: CategoryWithRelations) => void
  onDelete: (category: CategoryWithRelations) => void
  onSelect?: (category: CategoryWithRelations) => void
}> = ({ categories, onEdit, onDelete, onSelect }) => {
  return (
    <div className="space-y-2">
      {categories.map(category => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={() => onEdit(category)}
          onDelete={() => onDelete(category)}
          onSelect={() => onSelect?.(category)}
        />
      ))}
    </div>
  )
}

// Grid View Component
const CategoryGridView: React.FC<{
  categories: CategoryWithRelations[]
  onEdit: (category: CategoryWithRelations) => void
  onDelete: (category: CategoryWithRelations) => void
  onSelect?: (category: CategoryWithRelations) => void
}> = ({ categories, onEdit, onDelete, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map(category => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={() => onEdit(category)}
          onDelete={() => onDelete(category)}
          onSelect={() => onSelect?.(category)}
          variant="compact"
        />
      ))}
    </div>
  )
}

// Loading Skeleton
export const CategoryListSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  )
}