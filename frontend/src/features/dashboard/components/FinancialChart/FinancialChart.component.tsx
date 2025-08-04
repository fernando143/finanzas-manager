import { useState, useCallback } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import {
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { startOfMonth, endOfMonth } from 'date-fns'
import { useFinancialChartData } from './useFinancialChartData.hook'
import type { Income, Expense } from '../../../../types/api'
import type { ChartConfig, PeriodType } from '../../../../types/chart'

interface FinancialChartProps {
  incomes: Income[]
  expenses: Expense[]
  className?: string
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  incomes,
  expenses,
  className = ''
}) => {
  const [config, setConfig] = useState<ChartConfig>({
    period: 'month',
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    showProjection: true,
    showTrend: true
  })


  // Use the custom hook for financial chart data
  const {
    chartData,
    analysis,
    summary,
    formatCurrency,
    formatCompactCurrency,
    formatDate
  } = useFinancialChartData({ incomes, expenses, config })

  // Memoized tooltip component for performance
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        date: string;
        income: number;
        expenses: number;
        cumulativeExpenses: number;
        balance: number;
      };
    }>;
  }

  const CustomTooltip = useCallback(({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {formatDate(data.date)}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Ingresos:
              </span>
              <span className="font-medium">{formatCurrency(data.income)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                Gastos:
              </span>
              <span className="font-medium">{formatCurrency(data.expenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                Gastos Acum.:
              </span>
              <span className="font-medium">{formatCurrency(data.cumulativeExpenses)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className={`font-medium ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Balance:
              </span>
              <span className={`font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.balance)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }, [formatCurrency, formatDate])

  const handlePeriodChange = useCallback((period: PeriodType) => {
    setConfig(prev => ({
      ...prev,
      period,
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    }))
  }, [])

  const getAnalysisColor = useCallback((status: string) => {
    switch (status) {
      case 'surplus':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'deficit':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }, [])

  const getAnalysisIcon = useCallback((status: string) => {
    switch (status) {
      case 'surplus':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
      case 'deficit':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-yellow-500" />
    }
  }, [])

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header with controls */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <ChartBarIcon className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              Análisis Financiero Avanzado
            </h3>
          </div>

          {/* Period selector */}
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            <select
              value={config.period}
              onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
              className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
              <option value="year">Año</option>
            </select>
          </div>
        </div>

        {/* Analysis summary */}
        <div className={`mt-4 p-3 border rounded-lg ${getAnalysisColor(analysis.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getAnalysisIcon(analysis.status)}
              <span className="font-medium">
                {analysis.status === 'surplus' ? 'Superávit' :
                 analysis.status === 'deficit' ? 'Déficit' : 'Equilibrado'}
              </span>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">
                {formatCurrency(Math.abs(analysis.amount))}
              </div>
              <div className="text-sm">
                {analysis.percentage > 0 ? '+' : ''}{analysis.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={formatCompactCurrency}
              />

              {/* Income bars (green) */}
              <Bar
                dataKey="income"
                fill="#10b981"
                name="Ingresos"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />

              {/* Expense bars (red) */}
              <Bar
                dataKey="expenses"
                fill="#ef4444"
                name="Gastos"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />

              {/* Cumulative expenses line (red) */}
              <Line
                type="monotone"
                dataKey="cumulativeExpenses"
                stroke="#dc2626"
                strokeWidth={3}
                name="Gastos Acumulados"
                dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#dc2626', strokeWidth: 2 }}
              />

              {/* Cumulative income line (green horizontal) */}
              <Line
                type="step"
                dataKey="cumulativeIncome"
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Ingresos Acumulados"
                dot={false}
              />

              {/* Zero line reference */}
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />

              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCompactCurrency(summary.totalIncome)}
            </div>
            <div className="text-sm text-green-700">Total Ingresos</div>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {formatCompactCurrency(summary.totalExpenses)}
            </div>
            <div className="text-sm text-red-700">Total Gastos</div>
          </div>

          <div className={`text-center p-4 rounded-lg ${
            analysis.status === 'surplus' ? 'bg-green-50' :
            analysis.status === 'deficit' ? 'bg-red-50' : 'bg-yellow-50'
          }`}>
            <div className={`text-2xl font-bold ${
              analysis.status === 'surplus' ? 'text-green-600' :
              analysis.status === 'deficit' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {formatCompactCurrency(Math.abs(analysis.amount))}
            </div>
            <div className={`text-sm ${
              analysis.status === 'surplus' ? 'text-green-700' :
              analysis.status === 'deficit' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {analysis.status === 'surplus' ? 'Superávit' :
               analysis.status === 'deficit' ? 'Déficit' : 'Equilibrado'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Default export for lazy loading
export default FinancialChart
