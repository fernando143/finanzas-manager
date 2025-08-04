import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api/client.service'
import type { Expense } from '../../types/api'

interface UseExpensesReturn {
  expenses: Expense[]
  loading: boolean
  error: string | null
  fetchExpenses: () => Promise<void>
  createExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Expense | null>
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>) => Promise<Expense | null>
  deleteExpense: (id: string) => Promise<boolean>
  markAsPaid: (id: string) => Promise<boolean>
  refreshExpenses: () => Promise<void>
}

export const useExpenses = (): UseExpensesReturn => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<{expenses: Expense[]}>('/expenses')
      console.log('expensas response', response)
      if (response.success && response.data) {
        setExpenses(response.data.expenses )
      } else {
        setError(response.error || 'Error al obtener gastos')
        setExpenses([])
      }
    } catch (err) {
      setError('Error de conexión al obtener gastos')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [])

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

  // Auto-fetch on mount
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid,
    refreshExpenses
  }
}
