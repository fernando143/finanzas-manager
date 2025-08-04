// Chart types for advanced financial analysis

export interface FinancialChartData {
  date: string
  day: number
  income: number
  expenses: number
  cumulativeExpenses: number
  cumulativeIncome: number
  balance: number
  projectedBalance?: number
}

export interface ChartConfig {
  period: 'day' | 'week' | 'month' | 'year'
  startDate: Date
  endDate: Date
  showProjection: boolean
  showTrend: boolean
}

export interface SurplusDeficitAnalysis {
  amount: number
  percentage: number
  status: 'surplus' | 'deficit' | 'balanced'
  trend: 'improving' | 'declining' | 'stable'
}

export interface ChartTooltipData {
  date: string
  income: number
  expenses: number
  balance: number
  cumulativeExpenses: number
  dailyBreakdown?: {
    incomeCategory: string
    expenseCategory: string
    amount: number
  }[]
}

export type PeriodType = 'day' | 'week' | 'month' | 'year'

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface ChartSummary {
  totalIncome: number
  totalExpenses: number
  avgDailyIncome: number
  avgDailyExpenses: number
  highestIncomeDay: string | undefined
  highestIncomeAmount: number
  highestExpenseDay: string | undefined
  highestExpenseAmount: number
  daysWithIncome: number
  daysWithExpenses: number
  totalDays: number
}