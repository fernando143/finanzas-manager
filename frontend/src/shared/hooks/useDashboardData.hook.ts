import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api/client.service'
import type { Income, Expense } from '../../types/api'

interface UseDashboardDataReturn {
  incomes: Income[]
  expenses: Expense[]
  loading: boolean
  error: string | null
  refreshDashboardData: () => Promise<void>
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Fetching dashboard data...')
      
      // Fetch both incomes and expenses for current month in parallel
      const [incomesResponse, expensesResponse] = await Promise.all([
        apiClient.get<{ incomes: Income[] }>('/incomes/dashboard/current-month'),
        apiClient.get<{ expenses: Expense[] }>('/expenses/dashboard/current-month')
      ])

      console.log('📥 Dashboard data responses:', { incomesResponse, expensesResponse })

      if (incomesResponse.success && expensesResponse.success && 
          incomesResponse.data && expensesResponse.data) {
        console.log('✅ Dashboard data fetched successfully:', 
          incomesResponse.data.incomes.length, 'incomes,', 
          expensesResponse.data.expenses.length, 'expenses')
        
        setIncomes(incomesResponse.data.incomes)
        setExpenses(expensesResponse.data.expenses)
      } else {
        const errorMsg = incomesResponse.error || expensesResponse.error || 'Error al obtener datos del dashboard'
        console.error('❌ Failed to fetch dashboard data:', errorMsg)
        setError(errorMsg)
        setIncomes([])
        setExpenses([])
      }
    } catch (err) {
      console.error('💥 Exception while fetching dashboard data:', err)
      setError('Error de conexión al obtener datos del dashboard')
      setIncomes([])
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDashboardData = useCallback(async () => {
    await fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-fetch on mount
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    incomes,
    expenses,
    loading,
    error,
    refreshDashboardData
  }
}