import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useFinancialChartData } from './useFinancialChartData.hook'
import type { Income, Expense } from '../../../../types/api'
import type { ChartConfig } from '../../../../types/chart'

describe('useFinancialChartData', () => {
  // Mock system time to a fixed date to ensure test resilience
  beforeEach(() => {
    // Set system time to a fixed date to ensure test resilience
    // This ensures the test is independent of when it's actually run
    vi.setSystemTime(new Date(2025, 6, 15)) // July 15, 2025 (before test data period)
  })

  afterEach(() => {
    // Restore real system time after each test
    vi.useRealTimers()
  })

  it('should correctly process single income on first day of month', () => {
    // Arrange
    const incomes: Income[] = [
      {
        description: "sueldo",
        amount: 4700000,
        categoryId: "sueldo-category-id",
        frequency: "MONTHLY",
        incomeDate: "2025-08-01",
        userId: "1",
        id: "mdvxt6uce1gsu8z4enq",
        createdAt: "2025-07-15T12:00:00.000Z", // Fixed to match mocked system time
        updatedAt: "2025-07-15T12:00:00.000Z" // Fixed to match mocked system time
      }
    ]

    const expenses: Expense[] = []

    const config: ChartConfig = {
      period: 'month',
      startDate: new Date(2025, 7, 1), // Month is 0-indexed, so 7 = August
      endDate: new Date(2025, 7, 31),
      showProjection: true,
      showTrend: true
    }

    // Act
    const { result } = renderHook(() =>
      useFinancialChartData({ incomes, expenses, config })
    )

    // Assert
    const { chartData } = result.current

    // Should have 31 days for August
    expect(chartData).toHaveLength(31)

    // Verify day 1 (August 1st) - should have the income
    const day1 = chartData.find(day => day.date === "2025-08-01")
    expect(day1).toBeDefined()
    expect(day1).toEqual({
      date: "2025-08-01",
      day: 1,
      income: 4700000,
      expenses: 0,
      cumulativeExpenses: 0,
      cumulativeIncome: 4700000,
      balance: 4700000,
      projectedBalance: 4700000
    })

    // Verify day 2 (August 2nd) - should maintain cumulative income and show cumulative balance
    const day2 = chartData.find(day => day.date === "2025-08-02")
    expect(day2).toBeDefined()
    expect(day2).toEqual({
      date: "2025-08-02",
      day: 2,
      income: 0,
      expenses: 0,
      cumulativeExpenses: 0,
      cumulativeIncome: 4700000,
      balance: 4700000, // Cumulative balance: 4700000 - 0 = 4700000
      projectedBalance: 4700000
    })

    // Verify a few more specific days to ensure pattern continues
    const day3 = chartData.find(day => day.date === "2025-08-03")
    expect(day3).toEqual({
      date: "2025-08-03",
      day: 3,
      income: 0,
      expenses: 0,
      cumulativeExpenses: 0,
      cumulativeIncome: 4700000,
      balance: 4700000, // Cumulative balance: 4700000 - 0 = 4700000
      projectedBalance: 4700000
    })

    const day15 = chartData.find(day => day.date === "2025-08-15")
    expect(day15).toEqual({
      date: "2025-08-15",
      day: 15,
      income: 0,
      expenses: 0,
      cumulativeExpenses: 0,
      cumulativeIncome: 4700000,
      balance: 4700000, // Cumulative balance: 4700000 - 0 = 4700000
      projectedBalance: 4700000
    })

    const day31 = chartData.find(day => day.date === "2025-08-31")
    expect(day31).toEqual({
      date: "2025-08-31",
      day: 31,
      income: 0,
      expenses: 0,
      cumulativeExpenses: 0,
      cumulativeIncome: 4700000,
      balance: 4700000, // Cumulative balance: 4700000 - 0 = 4700000
      projectedBalance: 4700000
    })

    // Verify that all days from 2-31 follow the same pattern
    const daysWithoutIncome = chartData.filter(day => day.day >= 2 && day.day <= 31)
    expect(daysWithoutIncome).toHaveLength(30)

    daysWithoutIncome.forEach(day => {
      expect(day.income).toBe(0)
      expect(day.expenses).toBe(0)
      expect(day.cumulativeExpenses).toBe(0)
      expect(day.cumulativeIncome).toBe(4700000)
      expect(day.balance).toBe(4700000) // Cumulative balance: 4700000 - 0 = 4700000
      expect(day.projectedBalance).toBe(4700000)
    })

    // Verify that only day 1 has income
    const daysWithIncome = chartData.filter(day => day.income > 0)
    expect(daysWithIncome).toHaveLength(1)
    expect(daysWithIncome[0].day).toBe(1)

    // Verify formatting functions still work
    expect(typeof result.current.formatCurrency).toBe('function')
    expect(typeof result.current.formatCompactCurrency).toBe('function')
    expect(typeof result.current.formatDate).toBe('function')
  })

  it('should produce consistent results regardless of system date', () => {
    // Test the same scenario with different mocked system dates
    const testScenarios = [
      { date: new Date(2024, 0, 1), description: 'January 2024 (past year)' },
      { date: new Date(2025, 5, 1), description: 'June 2025 (before test period)' },
      { date: new Date(2025, 8, 15), description: 'September 2025 (after test period)' },
      { date: new Date(2026, 11, 31), description: 'December 2026 (future year)' }
    ]

    // Create reusable test data
    const createTestData = () => ({
      incomes: [
        {
          description: "sueldo",
          amount: 4700000,
          categoryId: "sueldo-category-id",
          frequency: "MONTHLY",
          incomeDate: "2025-08-01",
          userId: "1",
          id: "mdvxt6uce1gsu8z4enq",
          createdAt: "2025-07-15T12:00:00.000Z",
          updatedAt: "2025-07-15T12:00:00.000Z"
        }
      ] as Income[],
      expenses: [] as Expense[],
      config: {
        period: 'month' as const,
        startDate: new Date(2025, 7, 1), // August 1, 2025
        endDate: new Date(2025, 7, 31),  // August 31, 2025
        showProjection: true,
        showTrend: true
      } as ChartConfig
    })

    const expectedResults = {
      chartDataLength: 31,
      day1Income: 4700000,
      day1Balance: 4700000, // Cumulative balance
      totalIncome: 4700000,
      daysWithIncomeCount: 1
    }

    testScenarios.forEach(({ date, description }) => {
      // Set different system time for each scenario
      vi.setSystemTime(date)

      const { incomes, expenses, config } = createTestData()

      const { result } = renderHook(() =>
        useFinancialChartData({ incomes, expenses, config })
      )

      const { chartData } = result.current

      // Verify core functionality remains consistent regardless of system date
      expect(chartData, `Failed for ${description}`).toHaveLength(expectedResults.chartDataLength)

      const day1 = chartData.find(day => day.date === "2025-08-01")
      expect(day1?.income, `Day 1 income failed for ${description}`).toBe(expectedResults.day1Income)
      expect(day1?.balance, `Day 1 balance failed for ${description}`).toBe(expectedResults.day1Balance)

      const totalIncome = chartData.reduce((sum, day) => sum + day.income, 0)
      expect(totalIncome, `Total income failed for ${description}`).toBe(expectedResults.totalIncome)

      const daysWithIncome = chartData.filter(day => day.income > 0).length
      expect(daysWithIncome, `Days with income count failed for ${description}`).toBe(expectedResults.daysWithIncomeCount)
    })
  })

  it('should handle timezone edge cases correctly', () => {
    // Test with dates at timezone boundaries
    const timezoneTestCases = [
      new Date(2025, 7, 1, 0, 0, 0),   // Start of day
      new Date(2025, 7, 1, 12, 0, 0),  // Noon
      new Date(2025, 7, 1, 23, 59, 59) // End of day
    ]

    timezoneTestCases.forEach((mockDate, index) => {
      vi.setSystemTime(mockDate)

      const incomes: Income[] = [
        {
          description: "test income",
          amount: 1000000,
          categoryId: "test-category-id",
          frequency: "MONTHLY",
          incomeDate: "2025-08-01", // Same date as mock date
          userId: "1",
          id: "test-id",
          createdAt: "2025-07-15T12:00:00.000Z",
          updatedAt: "2025-07-15T12:00:00.000Z"
        }
      ]

      const config: ChartConfig = {
        period: 'month',
        startDate: new Date(2025, 7, 1),
        endDate: new Date(2025, 7, 31),
        showProjection: true,
        showTrend: true
      }

      const { result } = renderHook(() =>
        useFinancialChartData({ incomes, expenses: [], config })
      )

      const { chartData } = result.current
      const day1 = chartData.find(day => day.date === "2025-08-01")

      // Income should always be found on the correct date regardless of time
      expect(day1?.income, `Timezone test ${index} failed`).toBe(1000000)
      expect(chartData).toHaveLength(31) // August has 31 days
    })
  })

  it('should pass if run on August 4th, 2025 (tomorrow from original test date)', () => {
    // Simulate running the test "tomorrow" - this verifies the user's concern
    vi.setSystemTime(new Date(2025, 7, 4)) // August 4, 2025

    const incomes: Income[] = [
      {
        description: "sueldo",
        amount: 4700000,
        categoryId: "sueldo-category-id",
        frequency: "MONTHLY",
        incomeDate: "2025-08-01",
        userId: "1",
        id: "mdvxt6uce1gsu8z4enq",
        createdAt: "2025-07-15T12:00:00.000Z",
        updatedAt: "2025-07-15T12:00:00.000Z"
      }
    ]

    const config: ChartConfig = {
      period: 'month',
      startDate: new Date(2025, 7, 1),
      endDate: new Date(2025, 7, 31),
      showProjection: true,
      showTrend: true
    }

    const { result } = renderHook(() =>
      useFinancialChartData({ incomes, expenses: [], config })
    )

    const { chartData } = result.current

    // Should still work correctly even when run "tomorrow"
    expect(chartData).toHaveLength(31)

    const day1 = chartData.find(day => day.date === "2025-08-01")
    expect(day1?.income).toBe(4700000)
    expect(day1?.balance).toBe(4700000) // Cumulative balance

    // Also verify subsequent days maintain cumulative balance
    const day2 = chartData.find(day => day.date === "2025-08-02")
    expect(day2?.balance).toBe(4700000) // Should maintain cumulative balance
  })

  it('should calculate cumulative balance correctly with income and expenses example', () => {
    // Test the specific example provided by user:
    // Day 1: income 500, expenses 0, balance: 500
    // Day 2: income 0, expenses 10, balance: 490

    const incomes: Income[] = [
      {
        description: "test income",
        amount: 500,
        categoryId: "test-category-id",
        frequency: "MONTHLY",
        incomeDate: "2025-08-01",
        userId: "1",
        id: "income-1",
        createdAt: "2025-07-15T12:00:00.000Z",
        updatedAt: "2025-07-15T12:00:00.000Z"
      }
    ]

    const expenses: Expense[] = [
      {
        description: "test expense",
        amount: 10,
        categoryId: "Test",
        dueDate: "2025-08-02",
        userId: "1",
        id: "expense-1",
        createdAt: "2025-07-15T12:00:00.000Z",
        updatedAt: "2025-07-15T12:00:00.000Z",
        frequency: "MONTHLY",
        status: "PENDING"
      }
    ]

    const config: ChartConfig = {
      period: 'month',
      startDate: new Date(2025, 7, 1),
      endDate: new Date(2025, 7, 31),
      showProjection: true,
      showTrend: true
    }

    const { result } = renderHook(() =>
      useFinancialChartData({ incomes, expenses, config })
    )

    const { chartData } = result.current

    // Verify day 1: income 500, expenses 0, balance: 500
    const day1 = chartData.find(day => day.date === "2025-08-01")
    expect(day1).toEqual({
      date: "2025-08-01",
      day: 1,
      income: 500,
      expenses: 0,
      cumulativeExpenses: 0,
      cumulativeIncome: 500,
      balance: 500, // 500 - 0 = 500
      projectedBalance: 500
    })

    // Verify day 2: income 0, expenses 10, balance: 490 (cumulative)
    const day2 = chartData.find(day => day.date === "2025-08-02")
    expect(day2).toEqual({
      date: "2025-08-02",
      day: 2,
      income: 0,
      expenses: 10,
      cumulativeExpenses: 10,
      cumulativeIncome: 500,
      balance: 490, // 500 - 10 = 490 (cumulative balance)
      projectedBalance: 490
    })

    // Verify day 3: no activity, balance should remain 490
    const day3 = chartData.find(day => day.date === "2025-08-03")
    expect(day3).toEqual({
      date: "2025-08-03",
      day: 3,
      income: 0,
      expenses: 0,
      cumulativeExpenses: 10,
      cumulativeIncome: 500,
      balance: 490, // Should maintain cumulative balance: 500 - 10 = 490
      projectedBalance: 490
    })
  })
})
