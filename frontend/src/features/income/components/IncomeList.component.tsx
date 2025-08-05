import { useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { Income } from '../../../types/api'
import { IncomeForm } from './IncomeForm.component'
import { useIncomes } from '../../../shared/hooks'
import { Pagination } from '../../../shared/ui/components'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const IncomeList = () => {
  const { 
    incomes, 
    loading, 
    error, 
    pagination,
    createIncome, 
    updateIncome, 
    deleteIncome,
    setPage,
    currentPage
  } = useIncomes()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | undefined>(undefined)

  const handleSaveIncome = async (incomeData: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    console.log('💾 Saving income from form:', incomeData)
    let success = false
    
    if (editingIncome) {
      console.log('✏️ Updating existing income:', editingIncome.id)
      const result = await updateIncome(editingIncome.id, incomeData)
      success = result !== null
    } else {
      console.log('➕ Creating new income')
      const result = await createIncome(incomeData)
      success = result !== null
      console.log('📊 Create income result:', result ? 'Success' : 'Failed')
    }

    if (success) {
      console.log('✅ Income saved successfully, closing form')
      setEditingIncome(undefined)
      setIsFormOpen(false)
    } else {
      console.error('❌ Failed to save income')
      // Form stays open so user can see the error message
    }
  }

  const handleEdit = (income: Income) => {
    setEditingIncome(income)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
      await deleteIncome(id)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'WEEKLY': return 'Semanal'
      case 'BIWEEKLY': return 'Quincenal'
      case 'MONTHLY': return 'Mensual'
      case 'ANNUAL': return 'Anual'
      case 'ONE_TIME': return 'Una vez'
      default: return frequency
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Gestión de Ingresos
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra tus fuentes de ingresos recurrentes y únicos.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            disabled={loading}
            className="flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar ingresos
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando ingresos...</p>
        </div>
      )}

      {/* Income list */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Frecuencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Próxima Fecha
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incomes.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {income.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {income.categoryId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(income.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatFrequency(income.frequency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {income.nextDate
                          ? format(parseISO(income.nextDate), 'dd MMM yyyy', { locale: es })
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(income)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(income.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {incomes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No hay ingresos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={setPage}
          loading={loading}
        />
      )}

      <IncomeForm
        income={editingIncome}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingIncome(undefined)
        }}
        onSave={handleSaveIncome}
      />
    </div>
  )
}

// Default export for lazy loading
export default IncomeList