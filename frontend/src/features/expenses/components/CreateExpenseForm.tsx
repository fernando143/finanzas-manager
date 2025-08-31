import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline'
import type { Expense } from '../../../types/api'
import { useCategories } from '../../../shared/hooks'
import { createLocalDate, formatCurrencyARS } from '../../../shared/utils'
import { CurrencyInput } from '../../../shared/ui/components'
import { expenseSchema, type ExpenseFormData, defaultExpenseValues } from '../validation/expenseValidation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CreateExpenseFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'> & { recurrenceCount?: number }) => void
}

export const CreateExpenseForm = ({ isOpen, onClose, onSave }: CreateExpenseFormProps) => {
  const { expenseCategories, loading: categoriesLoading, refreshCategories } = useCategories()
  const [showPreview, setShowPreview] = useState(false)
  
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultExpenseValues
  })
  
  // Watch form values for preview
  const watchFrequency = watch('frequency')
  const watchDueDate = watch('dueDate')
  const watchRecurrenceCount = watch('recurrenceCount')
  const watchAmount = watch('amount')
  
  // Calculate recurring dates for preview
  const recurringDates = useMemo(() => {
    if (!watchDueDate || watchFrequency === 'ONE_TIME') return []
    
    const dates: Date[] = []
    const startDate = new Date(watchDueDate)
    const endOfYear = new Date(startDate.getFullYear(), 11, 31)
    
    // Use recurrenceCount if provided, otherwise calculate until end of year
    let count = watchRecurrenceCount || 0
    
    if (!count) {
      // Calculate how many occurrences until end of year
      let tempDate = new Date(startDate)
      while (tempDate <= endOfYear && dates.length < 52) {
        dates.push(new Date(tempDate))
        
        switch (watchFrequency) {
          case 'WEEKLY':
            tempDate.setDate(tempDate.getDate() + 7)
            break
          case 'BIWEEKLY':
            tempDate.setDate(tempDate.getDate() + 14)
            break
          case 'MONTHLY':
            const day = startDate.getDate()
            tempDate.setMonth(tempDate.getMonth() + 1)
            const lastDayOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate()
            tempDate.setDate(Math.min(day, lastDayOfMonth))
            break
          case 'ANNUAL':
            tempDate.setFullYear(tempDate.getFullYear() + 1)
            break
        }
      }
    } else {
      // Use specified count
      let tempDate = new Date(startDate)
      for (let i = 0; i < count && i < 52; i++) {
        dates.push(new Date(tempDate))
        
        switch (watchFrequency) {
          case 'WEEKLY':
            tempDate.setDate(tempDate.getDate() + 7)
            break
          case 'BIWEEKLY':
            tempDate.setDate(tempDate.getDate() + 14)
            break
          case 'MONTHLY':
            const day = startDate.getDate()
            tempDate.setMonth(tempDate.getMonth() + 1)
            const lastDayOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate()
            tempDate.setDate(Math.min(day, lastDayOfMonth))
            break
          case 'ANNUAL':
            tempDate.setFullYear(tempDate.getFullYear() + 1)
            break
        }
      }
    }
    
    return dates
  }, [watchDueDate, watchFrequency, watchRecurrenceCount])

  // Refresh categories when form opens
  useEffect(() => {
    if (isOpen) {
      refreshCategories()
      reset(defaultExpenseValues)
    }
  }, [isOpen, refreshCategories, reset])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const onSubmit = async (data: ExpenseFormData) => {
    // Confirmar si se van a crear múltiples egresos
    if (data.frequency !== 'ONE_TIME' && data.dueDate) {
      const count = data.recurrenceCount || recurringDates.length
      if (count > 1) {
        const confirmMessage = `¿Está seguro de crear ${count} egresos ${
          data.frequency === 'MONTHLY' ? 'mensuales' :
          data.frequency === 'WEEKLY' ? 'semanales' :
          data.frequency === 'BIWEEKLY' ? 'quincenales' :
          'anuales'
        } por ${formatCurrencyARS(data.amount)} cada uno?\n\nTotal: ${formatCurrencyARS(data.amount * count)}`
        
        if (!confirm(confirmMessage)) {
          return
        }
      }
    }
    
    // Convert dueDate to ISO format if provided
    let dueDateISO: string | undefined = undefined
    if (data.dueDate) {
      const dueDate = createLocalDate(data.dueDate)
      dueDateISO = dueDate.toISOString()
    }
    
    const expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'> & { recurrenceCount?: number } = {
      ...data,
      dueDate: dueDateISO
    }
    
    onSave(expenseData as any)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75" 
          onClick={onClose}
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
              Nuevo Egreso
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-500"
              aria-label="Cerrar modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

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

            {/* Campo de recurrencias - solo visible si frecuencia no es ONE_TIME */}
            {watchFrequency !== 'ONE_TIME' && (
              <div>
                <label htmlFor="recurrenceCount" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de recurrencias (opcional)
                </label>
                <Controller
                  name="recurrenceCount"
                  control={control}
                  render={({ field }) => (
                    <>
                      <input
                        id="recurrenceCount"
                        type="number"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined
                          field.onChange(value)
                        }}
                        min="1"
                        max="52"
                        placeholder="Dejar vacío para todo el año"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.recurrenceCount && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.recurrenceCount.message}
                        </p>
                      )}
                    </>
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Si no especifica un número, se crearán egresos hasta fin de año
                </p>
              </div>
            )}

            {/* Preview de fechas recurrentes */}
            {watchFrequency !== 'ONE_TIME' && watchDueDate && recurringDates.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-blue-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Preview de egresos a crear
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showPreview ? 'Ocultar' : 'Mostrar'} ({recurringDates.length} egresos)
                  </button>
                </div>
                
                {showPreview && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {recurringDates.slice(0, 12).map((date, index) => (
                      <div key={index} className="text-xs text-gray-700 flex justify-between">
                        <span>{format(date, "dd 'de' MMMM yyyy", { locale: es })}</span>
                        <span className="font-medium">{formatCurrencyARS(watchAmount || 0)}</span>
                      </div>
                    ))}
                    {recurringDates.length > 12 && (
                      <p className="text-xs text-gray-500 italic">
                        ... y {recurringDates.length - 12} más
                      </p>
                    )}
                  </div>
                )}
                
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    Total: {formatCurrencyARS((watchAmount || 0) * recurringDates.length)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateExpenseForm