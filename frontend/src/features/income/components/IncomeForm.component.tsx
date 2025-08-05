import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Income } from '../../../types/api'
import { useCategories } from '../../../shared/hooks'
import { createLocalDate, fromApiDateString } from '../../../shared/utils'
import { CurrencyInput } from '../../../shared/ui/components'

interface IncomeFormProps {
  income?: Income
  isOpen: boolean
  onClose: () => void
  onSave: (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void
}

export const IncomeForm = ({ income, isOpen, onClose, onSave }: IncomeFormProps) => {
  const { incomeCategories, loading: categoriesLoading } = useCategories()
  const [formData, setFormData] = useState({
    description: income?.description || '',
    amount: income?.amount || 0,
    categoryId: income?.categoryId || '',
    frequency: income?.frequency || 'MONTHLY' as const,
    incomeDate: income?.incomeDate ? fromApiDateString(income.incomeDate) : '',
    nextDate: income?.nextDate ? fromApiDateString(income.nextDate) : ''
  })

  // Reset form when income prop changes
  useEffect(() => {
    setFormData({
      description: income?.description || '',
      amount: income?.amount || 0,
      categoryId: income?.categoryId || '',
      frequency: income?.frequency || 'MONTHLY' as const,
      incomeDate: income?.incomeDate ? fromApiDateString(income.incomeDate) : '',
      nextDate: income?.nextDate ? fromApiDateString(income.nextDate) : ''
    })
  }, [income])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate incomeDate is provided
    if (!formData.incomeDate) {
      alert('La fecha del ingreso es requerida.')
      return
    }
    
    // Validate incomeDate is a valid date using local date creation
    const incomeDate = createLocalDate(formData.incomeDate)
    if (isNaN(incomeDate.getTime())) {
      alert('Por favor, ingrese una fecha válida para el ingreso.')
      return
    }
    
    // Optional: Validate nextDate if provided
    if (formData.nextDate) {
      const nextDate = createLocalDate(formData.nextDate)
      if (isNaN(nextDate.getTime())) {
        alert('Por favor, ingrese una fecha válida para la próxima fecha.')
        return
      }
    }
    
    const incomeData: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      description: formData.description,
      amount: formData.amount,
      categoryId: formData.categoryId,
      frequency: formData.frequency,
      incomeDate: createLocalDate(formData.incomeDate).toISOString(), // Create local date then convert to ISO
      nextDate: formData.nextDate ? createLocalDate(formData.nextDate).toISOString() : undefined
    }
    
    onSave(incomeData)
    onClose()
  }

  const handleChange = (field: string, value: any) => {
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
              {income ? 'Editar' : 'Nuevo'} Ingreso
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
                placeholder="Ej: Salario principal"
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
                disabled={categoriesLoading || incomeCategories.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">
                  {categoriesLoading 
                    ? 'Cargando categorías...' 
                    : incomeCategories.length === 0 
                      ? 'Inicializando categorías...'
                      : 'Seleccionar categoría'
                  }
                </option>
                {incomeCategories.map((category) => (
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
                Fecha del ingreso <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.incomeDate}
                onChange={(e) => handleChange('incomeDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Fecha en que se recibió/recibirá este ingreso
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Próxima fecha (opcional)
              </label>
              <input
                type="date"
                value={formData.nextDate}
                onChange={(e) => handleChange('nextDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Para ingresos recurrentes: cuándo será el próximo pago
              </p>
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
                {income ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Default export for lazy loading
export default IncomeForm