import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Expense } from '../../../types/api'
import { useCategories } from '../../../shared/hooks'
import { createLocalDate, fromApiDateString } from '../../../shared/utils'
import { CurrencyInput } from '../../../shared/ui/components'

interface ExpenseFormProps {
  expense?: Expense
  isOpen: boolean
  onClose: () => void
  onSave: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void
}

export const ExpenseForm = ({ expense, isOpen, onClose, onSave }: ExpenseFormProps) => {
  const { expenseCategories, loading: categoriesLoading } = useCategories()
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    amount: expense?.amount || 0,
    categoryId: expense?.categoryId || '',
    frequency: expense?.frequency || 'MONTHLY' as const,
    dueDate: expense?.dueDate ? fromApiDateString(expense.dueDate) : '',
    status: expense?.status || 'PENDING' as const
  })

  // Reset form when expense prop changes
  useEffect(() => {
    setFormData({
      description: expense?.description || '',
      amount: expense?.amount || 0,
      categoryId: expense?.categoryId || '',
      frequency: expense?.frequency || 'MONTHLY' as const,
      dueDate: expense?.dueDate ? fromApiDateString(expense.dueDate) : '',
      status: expense?.status || 'PENDING' as const
    })
  }, [expense])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert dueDate to ISO format if provided
    let dueDateISO: string | undefined = undefined
    if (formData.dueDate) {
      const dueDate = createLocalDate(formData.dueDate)
      if (isNaN(dueDate.getTime())) {
        alert('Por favor, ingrese una fecha válida para el vencimiento.')
        return
      }
      dueDateISO = dueDate.toISOString()
    }
    
    const expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      description: formData.description,
      amount: formData.amount,
      categoryId: formData.categoryId,
      frequency: formData.frequency,
      dueDate: dueDateISO,
      status: formData.status
    }
    
    // Only call onSave - let the parent component handle closing after success
    onSave(expenseData)
  }

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {expense ? 'Editar' : 'Nuevo'} Egreso
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Alquiler de vivienda"
              />
            </div>

            <div>
              <CurrencyInput
                value={formData.amount}
                onChange={(value) => handleChange('amount', value)}
                required
                label="Monto"
                placeholder="$ 0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                disabled={categoriesLoading || expenseCategories.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frecuencia
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de vencimiento (opcional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
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
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {expense ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Default export for lazy loading
export default ExpenseForm