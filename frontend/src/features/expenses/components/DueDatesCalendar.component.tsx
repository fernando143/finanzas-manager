import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { useExpenses } from '../../../shared/hooks'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { es } from 'date-fns/locale'

export const DueDatesCalendar = () => {
  const { expenses, markAsPaid } = useExpenses()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  })

  const getExpensesForDate = (date: Date) => {
    return expenses.filter(expense => 
      expense.dueDate && isSameDay(parseISO(expense.dueDate), date)
    )
  }

  const getTotalForDate = (date: Date) => {
    return getExpensesForDate(date).reduce((sum, expense) => sum + Number(expense.amount), 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overdue': return 'Vencido'
      case 'pending': return 'Pendiente'
      case 'paid': return 'Pagado'
      case 'partial': return 'Parcial'
      default: return status
    }
  }

  const handleMarkAsPaid = async (expenseId: string) => {
    await markAsPaid(expenseId)
  }

  const selectedDateExpenses = selectedDate ? getExpensesForDate(selectedDate) : []

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Calendario de Vencimientos</h1>
        <p className="mt-2 text-sm text-gray-700">
          Visualiza y gestiona tus pagos programados por fecha.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayExpenses = getExpensesForDate(day)
                const total = getTotalForDate(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isDayToday = isToday(day)

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[80px] p-2 text-left hover:bg-gray-50 border-b border-r border-gray-200 ${
                      isSelected ? 'bg-blue-50' : ''
                    } ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}`}
                  >
                    <div className={`text-sm font-medium ${isDayToday ? 'text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    {dayExpenses.length > 0 && isCurrentMonth && (
                      <div className="mt-1">
                        <div className="text-xs text-gray-600">
                          {dayExpenses.length} pago{dayExpenses.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs font-medium text-red-600">
                          {formatCurrency(total)}
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected date details */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                {selectedDate 
                  ? format(selectedDate, 'dd MMMM yyyy', { locale: es })
                  : 'Selecciona una fecha'
                }
              </h3>
            </div>
            <div className="px-6 py-4">
              {selectedDate ? (
                selectedDateExpenses.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateExpenses.map((expense) => (
                      <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {expense.description}
                            </h4>
                            <p className="text-sm text-gray-500">{expense.categoryId}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                            {getStatusText(expense.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-red-600">
                            {formatCurrency(expense.amount)}
                          </span>
                          {expense.status === 'PENDING' && (
                            <button
                              onClick={() => handleMarkAsPaid(expense.id)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Marcar como pagado
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total del día:</span>
                        <span className="text-lg font-bold text-red-600">
                          {formatCurrency(getTotalForDate(selectedDate))}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay pagos programados para esta fecha.</p>
                )
              ) : (
                <p className="text-sm text-gray-500">Haz clic en una fecha del calendario para ver los pagos programados.</p>
              )}
            </div>
          </div>

          {/* Monthly summary */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Resumen del mes
              </h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total pagos pendientes:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(
                    expenses
                      .filter(e => e.dueDate && isSameMonth(parseISO(e.dueDate), currentDate) && e.status === 'PENDING')
                      .reduce((sum, e) => sum + Number(e.amount), 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pagos vencidos:</span>
                <span className="font-medium text-red-600">
                  {expenses.filter(e => e.status === 'OVERDUE').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pagos completados:</span>
                <span className="font-medium text-green-600">
                  {expenses
                    .filter(e => e.dueDate && isSameMonth(parseISO(e.dueDate), currentDate) && e.status === 'PAID')
                    .length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Default export for lazy loading
export default DueDatesCalendar