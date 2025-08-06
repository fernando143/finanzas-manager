import React, { useState, useEffect } from 'react'
import { AlertTriangle, X, Info } from 'lucide-react'
import { categoryService } from '../services/category.service'
import type { CategoryWithRelations, CategoryDependencies } from '../types/category.types'

interface CategoryDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  category: CategoryWithRelations | null
  onConfirm: () => Promise<void>
}

export const CategoryDeleteDialog: React.FC<CategoryDeleteDialogProps> = ({
  isOpen,
  onClose,
  category,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [dependencies, setDependencies] = useState<CategoryDependencies | null>(null)
  const [loadingDependencies, setLoadingDependencies] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check dependencies when category changes
  useEffect(() => {
    const checkDependencies = async () => {
      if (!category) return

      setLoadingDependencies(true)
      setError(null)

      try {
        const deps = await categoryService.checkDependencies(category.id)
        setDependencies(deps)
      } catch (err) {
        console.error('Error checking dependencies:', err)
        setError('Error al verificar las dependencias')
      } finally {
        setLoadingDependencies(false)
      }
    }

    if (category && isOpen) {
      checkDependencies()
    } else {
      setDependencies(null)
      setError(null)
    }
  }, [category, isOpen])


  const handleDelete = async () => {
    if (!category || !dependencies?.canDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      await onConfirm()
      handleClose()
    } catch (err) {
      console.error('Error deleting category:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar categoría')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setDependencies(null)
    setError(null)
    setIsDeleting(false)
    onClose()
  }

  if (!isOpen || !category) return null

  const hasDependencies = dependencies && !dependencies.canDelete
  const isGlobal = categoryService.isGlobalCategory(category)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Dialog */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Eliminar Categoría
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isDeleting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Main Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    ¿Estás seguro?
                  </h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Esta acción no se puede deshacer. La categoría 
                    <span className="font-semibold"> "{category.name}" </span>
                    será eliminada permanentemente.
                  </p>
                </div>
              </div>
            </div>

            {/* Global Category Warning */}
            {isGlobal && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Esta es una categoría global del sistema y no puede ser eliminada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dependencies Check */}
            {loadingDependencies ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {hasDependencies && dependencies && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-medium text-red-800 mb-2">
                      No se puede eliminar
                    </h3>
                    <p className="text-sm text-red-700 mb-2">
                      Esta categoría tiene las siguientes dependencias:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {dependencies.transactions > 0 && (
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                          {dependencies.transactions} transacción{dependencies.transactions !== 1 ? 'es' : ''} asociada{dependencies.transactions !== 1 ? 's' : ''}
                        </li>
                      )}
                      {dependencies.subcategories > 0 && (
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                          {dependencies.subcategories} subcategoría{dependencies.subcategories !== 1 ? 's' : ''}
                        </li>
                      )}
                      {dependencies.budgets > 0 && (
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                          Usada en {dependencies.budgets} presupuesto{dependencies.budgets !== 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                    <p className="text-sm text-red-700 mt-3">
                      Para eliminar esta categoría, primero debes:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1 mt-1">
                      {dependencies.transactions > 0 && (
                        <li>• Reasignar o eliminar las transacciones</li>
                      )}
                      {dependencies.subcategories > 0 && (
                        <li>• Eliminar las subcategorías</li>
                      )}
                      {dependencies.budgets > 0 && (
                        <li>• Actualizar los presupuestos</li>
                      )}
                    </ul>
                  </div>
                )}

                {dependencies?.canDelete && !isGlobal && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          Esta categoría no tiene dependencias y puede ser eliminada de forma segura.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isDeleting || 
                loadingDependencies || 
                !dependencies?.canDelete || 
                isGlobal
              }
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </span>
              ) : (
                'Eliminar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}