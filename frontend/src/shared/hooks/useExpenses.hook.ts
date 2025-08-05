import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api/client.service'
import type { Expense } from '../../types/api'

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

interface UseExpensesParams {
  page?: number
  limit?: number
}

interface UseExpensesReturn {
  expenses: Expense[]
  loading: boolean
  error: string | null
  pagination: PaginationData | null
  fetchExpenses: (params?: UseExpensesParams) => Promise<void>
  createExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Expense | null>
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>) => Promise<Expense | null>
  deleteExpense: (id: string) => Promise<boolean>
  markAsPaid: (id: string) => Promise<boolean>
  refreshExpenses: () => Promise<void>
  setPage: (page: number) => void
  currentPage: number
}

export const useExpenses = (): UseExpensesReturn => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchExpenses = useCallback(async (params?: UseExpensesParams) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      const page = params?.page || currentPage
      const limit = params?.limit || 10
      
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      
      const response = await apiClient.get<{expenses: Expense[], pagination: PaginationData}>(`/expenses?${queryParams}`)
      console.log('expenses response', response)
      if (response.success && response.data) {
        setExpenses(response.data.expenses)
        setPagination(response.data.pagination)
        if (params?.page) {
          setCurrentPage(params.page)
        }
      } else {
        setError(response.error || 'Error al obtener gastos')
        setExpenses([])
        setPagination(null)
      }
    } catch (err) {
      setError('Error de conexión al obtener gastos')
      setExpenses([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  const createExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<Expense>('/expenses', expenseData)

      if (response.success && response.data) {
        // Optimistic update
        setExpenses(prev => [response.data!, ...prev])
        return response.data
      } else {
        setError(response.error || 'Error al crear gasto')
        return null
      }
    } catch (err) {
      setError('Error de conexión al crear gasto')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateExpense = useCallback(async (id: string, expenseData: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>): Promise<Expense | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.patch<Expense>(`/expenses/${id}`, expenseData)

      if (response.success && response.data) {
        // Optimistic update
        setExpenses(prev => prev.map(expense =>
          expense.id === id ? response.data! : expense
        ))
        return response.data
      } else {
        setError(response.error || 'Error al actualizar gasto')
        return null
      }
    } catch (err) {
      setError('Error de conexión al actualizar gasto')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.delete(`/expenses/${id}`)

      if (response.success) {
        // Optimistic update
        setExpenses(prev => prev.filter(expense => expense.id !== id))
        return true
      } else {
        setError(response.error || 'Error al eliminar gasto')
        return false
      }
    } catch (err) {
      setError('Error de conexión al eliminar gasto')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsPaid = useCallback(async (id: string): Promise<boolean> => {
    return await updateExpense(id, { status: 'PAID' }) !== null
  }, [updateExpense])

  const refreshExpenses = useCallback(async () => {
    await fetchExpenses()
  }, [fetchExpenses])

  const setPage = useCallback((page: number) => {
    fetchExpenses({ page })
  }, [fetchExpenses])

  // Auto-fetch on mount
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  return {
    expenses,
    loading,
    error,
    pagination,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid,
    refreshExpenses,
    setPage,
    currentPage
  }
}
