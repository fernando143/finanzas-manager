import { useState } from 'react'
import { IncomeList } from '../../../features/income/components/IncomeList.component'
import { ExpenseList } from '../../../features/expenses/components/ExpenseList.component'

export const TransactionList = () => {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income')

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Gestión de Transacciones
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Administra tus ingresos y egresos desde un solo lugar.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('income')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'income'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expense'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Egresos
            </button>
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'income' ? <IncomeList /> : <ExpenseList />}
      </div>
    </div>
  )
}

// Default export for lazy loading
export default TransactionList