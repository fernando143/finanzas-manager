import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Expense } from '../../../types/api'
import { useCategories } from '../../../shared/hooks'
import { createLocalDate, fromApiDateString } from '../../../shared/utils'
import { CurrencyInput } from '../../../shared/ui/components'
import { expenseSchema, type ExpenseFormData } from '../validation/expenseValidation'

interface EditExpenseFormProps {
  expense: Expense
  isOpen: boolean
  onClose: () => void
  onSave: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>) => void
}

export const EditExpenseForm = ({ expense, isOpen, onClose, onSave }: EditExpenseFormProps) => {
  const { expenseCategories, loading: categoriesLoading, refreshCategories } = useCategories()
  
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.categoryId,
      frequency: expense.frequency,
      dueDate: expense.dueDate ? fromApiDateString(expense.dueDate) : '',
      status: expense.status
    }
  })

  // Reset form when expense changes
  useEffect(() => {
    reset({
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.categoryId,
      frequency: expense.frequency,
      dueDate: expense.dueDate ? fromApiDateString(expense.dueDate) : '',
      status: expense.status
    })
  }, [expense, reset])

  // Refresh categories when form opens
  useEffect(() => {
    if (isOpen) {
      refreshCategories()
    }
  }, [isOpen, refreshCategories])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDirty) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isDirty, onClose])

  const onSubmit = async (data: ExpenseFormData) => {
    // Convert dueDate to ISO format if provided
    let dueDateISO: string | undefined = undefined
    if (data.dueDate) {
      const dueDate = createLocalDate(data.dueDate)
      dueDateISO = dueDate.toISOString()
    }
    
    const expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'> = {
      ...data,
      dueDate: dueDateISO
    }
    
    onSave(expenseData)
  }

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm('¿Estás seguro de que quieres cerrar? Los cambios no guardados se perderán.')
      if (confirmed) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75" 
          onClick={handleClose}
          aria-hidden="true"
        />
        <div 
          className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 id="modal-title" className="text-lg font-medium text-gray-900">
              Editar Egreso
            </h3>
            <button 
              onClick={handleClose} 
              className="text-gray-400 hover:text-gray-500"
              aria-label="Cerrar modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {isDirty && (
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">Tienes cambios sin guardar</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                id="description"
                type="text"
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Alquiler de vivienda"
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && (
                <p id="description-error" className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      required
                      label="Monto"
                      placeholder="$ 0,00"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.amount.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                id="categoryId"
                {...register('categoryId')}
                disabled={categoriesLoading || expenseCategories.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                aria-invalid={errors.categoryId ? 'true' : 'false'}
                aria-describedby={errors.categoryId ? 'category-error' : undefined}
              >
                <option value="">
                  {categoriesLoading 
                    ? 'Cargando categorías...' 
                    : expenseCategories.length === 0 
                      ? 'Inicializando categorías...'
                      : 'Seleccionar categoría'
                  }
                </option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p id="category-error" className="mt-1 text-sm text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Frecuencia
              </label>
              <select
                id="frequency"
                {...register('frequency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ONE_TIME">Una vez</option>
                <option value="WEEKLY">Semanal</option>
                <option value="BIWEEKLY">Quincenal</option>
                <option value="MONTHLY">Mensual</option>
                <option value="ANNUAL">Anual</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de vencimiento (opcional)
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-invalid={errors.dueDate ? 'true' : 'false'}
                aria-describedby={errors.dueDate ? 'duedate-error' : undefined}
              />
              {errors.dueDate && (
                <p id="duedate-error" className="mt-1 text-sm text-red-600">
                  {errors.dueDate.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="OVERDUE">Vencido</option>
                <option value="PARTIAL">Parcial</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditExpenseForm