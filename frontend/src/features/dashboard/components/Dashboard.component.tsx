import { useMemo } from 'react'
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useDashboardData } from '../../../shared/hooks'
import { format, isAfter, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { FinancialChart } from './FinancialChart/FinancialChart.component'
import { formatCurrencyARS } from '../../../shared/utils'

interface DashboardStats {
  monthlyIncome: number
  monthlyExpenses: number
  balance: number
  upcomingPayments: number
  overduePayments: number
}

export const Dashboard = () => {
  const { incomes, expenses, loading, error } = useDashboardData()

  // Calculate dashboard statistics from real data
  const stats = useMemo((): DashboardStats => {
    const totalIncome = incomes.reduce((sum, income) => sum + Number(income.amount), 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const overdueCount = expenses.filter(expense => expense.status === 'OVERDUE').length
    const upcomingCount = expenses.filter(expense =>
      expense.status === 'PENDING' && expense.dueDate &&
      isAfter(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), parseISO(expense.dueDate))
    ).length

    return {
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      balance: totalIncome - totalExpenses,
      upcomingPayments: upcomingCount,
      overduePayments: overdueCount
    }
  }, [incomes, expenses])

  // Calculate upcoming expenses
  const upcomingExpenses = useMemo(() => {
    return expenses
      .filter(expense => expense.status === 'PENDING' || expense.status === 'OVERDUE')
      .slice(0, 5)
  }, [expenses])

  // Calculate recent transactions
  const recentTransactions = useMemo(() => {
    const allTransactions = [
      ...incomes.map(item => ({ ...item, type: 'income' as const })),
      ...expenses.map(item => ({ ...item, type: 'expense' as const }))
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return allTransactions.slice(0, 5)
  }, [incomes, expenses])


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'paid':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Vencido'
      case 'pending':
        return 'Pendiente'
      case 'paid':
        return 'Pagado'
      default:
        return status
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
          Dashboard Financiero
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Resumen de tu situación financiera para {format(new Date(), 'MMMM yyyy', { locale: es })}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-8 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar datos del dashboard
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
        <div className="mb-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando datos financieros...</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ingresos Mensuales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrencyARS(stats.monthlyIncome)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Gastos Mensuales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrencyARS(stats.monthlyExpenses)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className={`h-6 w-6 ${stats.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Balance Mensual
                  </dt>
                  <dd className={`text-lg font-medium ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrencyARS(stats.balance)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pagos Vencidos
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {stats.overduePayments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming payments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Próximos Vencimientos
            </h3>
            <div className="space-y-3">
              {upcomingExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {expense.dueDate && format(parseISO(expense.dueDate), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrencyARS(expense.amount)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                      {getStatusText(expense.status)}
                    </span>
                  </div>
                </div>
              ))}
              {upcomingExpenses.length === 0 && (
                <p className="text-sm text-gray-500">No hay pagos próximos</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Transacciones Recientes
            </h3>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={`${transaction.id}-${'type' in transaction ? transaction.type : 'unknown'}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${'type' in transaction && transaction.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.categoryId}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${'type' in transaction && transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {'type' in transaction && transaction.type === 'income' ? '+' : '-'}{formatCurrencyARS(transaction.amount)}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-sm text-gray-500">No hay transacciones recientes</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Chart Section */}
      {!loading && !error && (
        <div className="mt-8">
          <FinancialChart
            incomes={incomes}
            expenses={expenses}
          />
        </div>
      )}
    </div>
  )
}

// Default export for lazy loading
export default Dashboard
