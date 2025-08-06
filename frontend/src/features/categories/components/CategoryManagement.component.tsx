import React, { useState, useCallback } from 'react'
import { useCategories } from '../../../shared/hooks/useCategories.hook'
import { CategoryList } from './CategoryList.component'
import { CategoryForm } from './CategoryForm.component'
import { CategoryDeleteDialog } from './CategoryDeleteDialog.component'
import type { CategoryWithRelations, CategoryCreateDTO, CategoryUpdateDTO } from '../types/category.types'

export const CategoryManagement: React.FC = () => {
  const {
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories
  } = useCategories()

  // State management
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithRelations | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Show success message temporarily
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Handle category creation
  const handleCreate = useCallback(async (data: CategoryCreateDTO) => {
    try {
      const newCategory = await createCategory(data)
      if (newCategory) {
        showSuccess('Categoría creada exitosamente')
        setIsFormOpen(false)
        // Force refresh to ensure categories are up to date
        await refreshCategories()
      }
    } catch (error) {
      console.error('Error creating category:', error)
      throw error // Let the form handle the error display
    }
  }, [createCategory, refreshCategories])

  // Handle category update
  const handleUpdate = useCallback(async (data: CategoryUpdateDTO) => {
    if (!selectedCategory) return

    try {
      const updatedCategory = await updateCategory(selectedCategory.id, data)
      if (updatedCategory) {
        showSuccess('Categoría actualizada exitosamente')
        setIsFormOpen(false)
        setSelectedCategory(null)
      }
    } catch (error) {
      console.error('Error updating category:', error)
      throw error // Let the form handle the error display
    }
  }, [selectedCategory, updateCategory])

  // Handle category deletion
  const handleDelete = useCallback(async () => {
    if (!selectedCategory) return

    try {
      const success = await deleteCategory(selectedCategory.id)
      if (success) {
        showSuccess('Categoría eliminada exitosamente')
        setIsDeleteDialogOpen(false)
        setSelectedCategory(null)
        // Force a refresh to update the list after deletion
        await refreshCategories()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error // Let the dialog handle the error display
    }
  }, [selectedCategory, deleteCategory, refreshCategories])

  // Handle edit action
  const handleEdit = useCallback((category: CategoryWithRelations) => {
    setSelectedCategory(category)
    setIsFormOpen(true)
  }, [])

  // Handle delete request
  const handleDeleteRequest = useCallback((category: CategoryWithRelations) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }, [])

  // Handle create new
  const handleCreateNew = useCallback(() => {
    setSelectedCategory(null)
    setIsFormOpen(true)
  }, [])

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: CategoryCreateDTO | CategoryUpdateDTO) => {
    if (selectedCategory) {
      await handleUpdate(data as CategoryUpdateDTO)
    } else {
      await handleCreate(data as CategoryCreateDTO)
    }
  }, [selectedCategory, handleCreate, handleUpdate])

  return (
    <div className="category-management container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
        <p className="text-gray-600 mt-1">
          Administra las categorías para organizar tus ingresos y egresos
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            onClick={refreshCategories}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <CategoryList
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onCreateNew={handleCreateNew}
        />
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedCategory(null)
        }}
        category={selectedCategory || undefined}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <CategoryDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedCategory(null)
        }}
        category={selectedCategory}
        onConfirm={handleDelete}
      />
    </div>
  )
}

// Export as default for lazy loading
export default CategoryManagement