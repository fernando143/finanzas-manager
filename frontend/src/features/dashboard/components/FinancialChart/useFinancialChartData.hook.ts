import { useMemo, useCallback } from 'react'
import { format, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Income, Expense } from '../../../../types/api'
import type {
  FinancialChartData,
  ChartConfig,
  SurplusDeficitAnalysis,
  ChartSummary
} from '../../../../types/chart'

interface UseFinancialChartDataParams {
  incomes: Income[]
  expenses: Expense[]
  config: ChartConfig
}

interface UseFinancialChartDataReturn {
  chartData: FinancialChartData[]
  analysis: SurplusDeficitAnalysis
  summary: ChartSummary
  formatCurrency: (value: number) => string
  formatCompactCurrency: (value: number) => string
  formatDate: (date: string) => string
}

export const useFinancialChartData = ({
  incomes,
  expenses,
  config
}: UseFinancialChartDataParams): UseFinancialChartDataReturn => {
  // Memoized currency formatters
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value)
  }, [])
  const formatCompactCurrency = useCallback((value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return formatCurrency(value)
  }, [formatCurrency])

  // Helper function to safely parse and validate dates (GMT-3 timezone-safe)
  const parseAndValidateDate = useCallback((dateString: string | undefined): Date | null => {
    if (!dateString) return null

    // Parse YYYY-MM-DD strings in local timezone to avoid shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number)
      return new Date(year, month - 1, day) // month is 0-indexed
    }

    // For ISO datetime strings from API (stored as 15:00 UTC for GMT-3 noon)
    const parsedDate = new Date(dateString)
    if (isNaN(parsedDate.getTime())) return null

    // The Date object will automatically convert UTC to local timezone (GMT-3)
    // So a date stored as "2025-08-01T15:00:00.000Z" will display as Aug 1, 12:00 in GMT-3
    return parsedDate
  }, [])

  const formatDate = useCallback((date: string) => {
    // Parse date in local timezone to avoid UTC conversion issues
    // This ensures "2025-08-01" displays as August 1st in GMT-3, not July 31st
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      const localDate = new Date(year, month - 1, day) // month is 0-indexed
      return format(localDate, 'dd MMM yyyy', { locale: es })
    }

    // For other date formats, use the existing parseAndValidateDate logic
    const parsedDate = parseAndValidateDate(date)
    if (parsedDate) {
      return format(parsedDate, 'dd MMM yyyy', { locale: es })
    }

    // Fallback to original behavior if parsing fails
    return format(new Date(date), 'dd MMM yyyy', { locale: es })
  }, [parseAndValidateDate])

  // Helper function to normalize dates for comparison (GMT-3 aware)
  const normalizeDate = useCallback((date: Date): Date => {
    // Create normalized date in local timezone (GMT-3)
    // This ensures we're comparing dates in the user's timezone context
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }, [])



  // Calculate daily income for a specific date
  const calculateDailyIncome = useCallback((day: Date, incomes: Income[]): number => {
    const normalizedDay = normalizeDate(day)

    return incomes
      .filter(income => {
        // Use incomeDate if available, fallback to nextDate for existing data
        const dateToUse = income.incomeDate || income.nextDate
        const incomeDate = parseAndValidateDate(dateToUse)

        if (!incomeDate) return false

        const normalizedIncomeDate = normalizeDate(incomeDate)
        return normalizedIncomeDate.getTime() === normalizedDay.getTime()
      })
      .reduce((sum, income) => sum + Number(income.amount), 0)
  }, [normalizeDate, parseAndValidateDate])

  // Calculate daily expenses for a specific date
  const calculateDailyExpenses = useCallback((day: Date, expenses: Expense[]): number => {
    const normalizedDay = normalizeDate(day)

    return expenses
      .filter(expense => {
        const expenseDate = parseAndValidateDate(expense.dueDate)

        if (!expenseDate) return false

        const normalizedExpenseDate = normalizeDate(expenseDate)
        return normalizedExpenseDate.getTime() === normalizedDay.getTime()
      })
      .reduce((sum, expense) => sum + Number(expense.amount), 0)
  }, [normalizeDate, parseAndValidateDate])

  // Main chart data calculation
  const chartData = useMemo((): FinancialChartData[] => {
    // Use config dates directly with eachDayOfInterval
    const days = eachDayOfInterval({
      start: config.startDate,
      end: config.endDate
    })

    let cumulativeExpenses = 0
    let cumulativeIncome = 0

    return days.map((day) => {
      // Only normalize the day for calculations and comparisons
      const normalizedDay = normalizeDate(day)
      const dayOfMonth = normalizedDay.getDate()

      // Calculate daily amounts
      const dailyIncome = calculateDailyIncome(normalizedDay, incomes)
      const dailyExpenses = calculateDailyExpenses(normalizedDay, expenses)

      // Update cumulative values
      cumulativeIncome += dailyIncome
      cumulativeExpenses += dailyExpenses

      const balance = cumulativeIncome - cumulativeExpenses // Cumulative balance instead of daily balance
      const projectedBalance = cumulativeIncome - cumulativeExpenses

      return {
        date: format(normalizedDay, 'yyyy-MM-dd'),
        day: dayOfMonth,
        income: dailyIncome,
        expenses: dailyExpenses,
        cumulativeExpenses,
        cumulativeIncome,
        balance,
        projectedBalance
      }
    })
  }, [incomes, expenses, config.startDate, config.endDate, calculateDailyIncome, calculateDailyExpenses, normalizeDate])

  // Calculate financial analysis
  const analysis = useMemo((): SurplusDeficitAnalysis => {
    const totalIncome = chartData.reduce((sum, day) => sum + day.income, 0)
    const totalExpenses = chartData.reduce((sum, day) => sum + day.expenses, 0)
    const amount = totalIncome - totalExpenses
    const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0

    // Calculate trend based on last vs first half comparison
    const midPoint = Math.floor(chartData.length / 2)
    const firstHalfBalance = chartData
      .slice(0, midPoint)
      .reduce((sum, day) => sum + day.balance, 0)
    const secondHalfBalance = chartData
      .slice(midPoint)
      .reduce((sum, day) => sum + day.balance, 0)

    let trend: SurplusDeficitAnalysis['trend'] = 'stable'
    if (secondHalfBalance > firstHalfBalance * 1.1) {
      trend = 'improving'
    } else if (secondHalfBalance < firstHalfBalance * 0.9) {
      trend = 'declining'
    }

    return {
      amount,
      percentage,
      status: amount > 0 ? 'surplus' : amount < 0 ? 'deficit' : 'balanced',
      trend
    }
  }, [chartData])

  // Calculate summary statistics
  const summary = useMemo((): ChartSummary => {
    const totalIncome = chartData.reduce((sum, day) => sum + day.income, 0)
    const totalExpenses = chartData.reduce((sum, day) => sum + day.expenses, 0)

    // Find highest income/expense days
    const highestIncomeDay = chartData.reduce((max, day) =>
      day.income > max.income ? day : max, chartData[0] || { income: 0 })

    const highestExpenseDay = chartData.reduce((max, day) =>
      day.expenses > max.expenses ? day : max, chartData[0] || { expenses: 0 })

    // Calculate averages
    const avgDailyIncome = chartData.length > 0 ? totalIncome / chartData.length : 0
    const avgDailyExpenses = chartData.length > 0 ? totalExpenses / chartData.length : 0

    // Calculate days with activity
    const daysWithIncome = chartData.filter(day => day.income > 0).length
    const daysWithExpenses = chartData.filter(day => day.expenses > 0).length

    return {
      totalIncome,
      totalExpenses,
      avgDailyIncome,
      avgDailyExpenses,
      highestIncomeDay: highestIncomeDay?.date,
      highestIncomeAmount: highestIncomeDay?.income || 0,
      highestExpenseDay: highestExpenseDay?.date,
      highestExpenseAmount: highestExpenseDay?.expenses || 0,
      daysWithIncome,
      daysWithExpenses,
      totalDays: chartData.length
    }
  }, [chartData])

  return {
    chartData,
    analysis,
    summary,
    formatCurrency,
    formatCompactCurrency,
    formatDate
  }
}
