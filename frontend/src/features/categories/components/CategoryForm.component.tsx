import React, { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { z } from 'zod'
import { useCategories } from '../../../shared/hooks/useCategories.hook'
import type { 
  CategoryWithRelations, 
  CategoryFormData, 
  CategoryType
} from '../types/category.types'

// Validation schema with Zod
const CategorySchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  type: z.enum(['INCOME', 'EXPENSE'] as const, {
    errorMap: () => ({ message: 'Selecciona un tipo válido' })
  }),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Formato de color inválido')
    .optional()
    .or(z.literal('')),
  parentId: z.string().optional().nullable()
})

interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  category?: CategoryWithRelations // For editing
  onSubmit: (data: CategoryFormData) => Promise<void>
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  category,
  onSubmit
}) => {
  const { categories } = useCategories()
  const isEditing = !!category

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'EXPENSE' as CategoryType,
    color: '#3B82F6',
    parentId: null
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Initialize form data when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type as CategoryType,
        color: category.color || '#3B82F6',
        parentId: category.parentId
      })
    } else {
      setFormData({
        name: '',
        type: 'EXPENSE' as CategoryType,
        color: '#3B82F6',
        parentId: null
      })
    }
    setErrors({})
  }, [category])

  // Filter parent categories (same type, not the current category)
  const availableParents = useMemo(() => {
    return categories.filter(cat => {
      // Must be same type
      if (cat.type !== formData.type) return false
      // Cannot be itself (for editing)
      if (isEditing && cat.id === category.id) return false
      // Cannot be a child of the current category (prevent circular reference)
      if (isEditing && category.children?.some(child => child.id === cat.id)) return false
      return true
    })
  }, [categories, formData.type, isEditing, category])

  // Handle input changes
  const handleChange = (field: keyof CategoryFormData, value: string | null | boolean) => {
    // Special handling for parentId - convert empty string to null
    const processedValue = field === 'parentId' && value === '' ? null : value
    
    setFormData(prev => ({ ...prev, [field]: processedValue }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    try {
      CategorySchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Clean up data before submission - remove null parentId
      const submitData = { ...formData }
      if (submitData.parentId === null || submitData.parentId === '') {
        delete (submitData as Record<string, unknown>).parentId
      }
      
      await onSubmit(submitData)
      handleClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      
      // Extract and display specific validation errors from backend
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage) {
        // Check for specific error messages
        if (errorMessage.includes('Ya existe una categoría con ese nombre') || 
            errorMessage.includes('already exists') ||
            errorMessage.includes('duplicate')) {
          setErrors({ name: 'Ya existe una categoría con ese nombre' })
        } else if (errorMessage.includes('Profundidad máxima excedida')) {
          setErrors({ parentId: 'Profundidad máxima excedida (máximo 3 niveles)' })
        } else if (errorMessage.includes('Tipos inconsistentes')) {
          setErrors({ parentId: 'La categoría padre debe ser del mismo tipo' })
        } else if (errorMessage.includes('Referencia circular')) {
          setErrors({ parentId: 'No se puede crear una referencia circular' })
        } else {
          // Show generic error as name error (most common)
          setErrors({ name: errorMessage })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setFormData({
      name: '',
      type: 'EXPENSE' as CategoryType,
      color: '#3B82F6',
      parentId: null
    })
    setErrors({})
    setShowColorPicker(false)
    onClose()
  }

  if (!isOpen) return null

  // Color presets
  const colorPresets = [
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {isEditing ? 'Editar' : 'Nueva'} Categoría
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Alimentación"
                disabled={isSubmitting}
                aria-label="Nombre de la categoría"
              />
              {errors.name && (
                <span className="text-red-500 text-sm mt-1">{errors.name}</span>
              )}
            </div>

            {/* Type Selector (only for new categories) */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                  aria-label="Tipo de categoría"
                >
                  <option value="INCOME">Ingreso</option>
                  <option value="EXPENSE">Egreso</option>
                </select>
                {errors.type && (
                  <span className="text-red-500 text-sm mt-1">{errors.type}</span>
                )}
              </div>
            )}

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: formData.color }}
                  disabled={isSubmitting}
                  data-testid="color-picker"
                  aria-label="Seleccionar color"
                ></button>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.color ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="#3B82F6"
                  disabled={isSubmitting}
                />
              </div>
              {errors.color && (
                <span className="text-red-500 text-sm mt-1">{errors.color}</span>
              )}

              {/* Color Presets */}
              {showColorPicker && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-6 gap-2">
                    {colorPresets.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          handleChange('color', color)
                          setShowColorPicker(false)
                        }}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parent Category Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría Padre (Opcional)
              </label>
              <select
                name="parentId"
                value={formData.parentId || ''}
                onChange={(e) => handleChange('parentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                aria-label="Categoría padre"
              >
                <option value="">Sin categoría padre</option>
                {availableParents.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parent ? `${cat.parent.name} → ` : ''}{cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  isEditing ? 'Actualizar' : 'Crear'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Form skeleton for loading state
export const CategoryFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
}