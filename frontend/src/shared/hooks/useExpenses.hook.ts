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
  search?: string
  createdFrom?: string
  createdTo?: string
  dueFrom?: string
  dueTo?: string
  category?: string
  frequency?: string
  status?: string
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
  filters: UseExpensesParams
  setFilters: (filters: UseExpensesParams) => void
}

export const useExpenses = (): UseExpensesReturn => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<UseExpensesParams>({})

  const fetchExpenses = useCallback(async (params?: UseExpensesParams) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      const page = params?.page || currentPage
      const limit = params?.limit || 10
      
      // Add pagination parameters
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      
      // Add filter parameters from both params and state
      const combinedFilters = { ...filters, ...params }
      
      // Add search filter
      if (combinedFilters.search) {
        queryParams.append('search', combinedFilters.search)
      }
      
      // Add date filters
      if (combinedFilters.createdFrom) {
        queryParams.append('createdFrom', combinedFilters.createdFrom)
      }
      if (combinedFilters.createdTo) {
        queryParams.append('createdTo', combinedFilters.createdTo)
      }
      if (combinedFilters.dueFrom) {
        queryParams.append('dueFrom', combinedFilters.dueFrom)
      }
      if (combinedFilters.dueTo) {
        queryParams.append('dueTo', combinedFilters.dueTo)
      }
      
      // Add other filters if present
      if (combinedFilters.category) {
        queryParams.append('category', combinedFilters.category)
      }
      if (combinedFilters.frequency) {
        queryParams.append('frequency', combinedFilters.frequency)
      }
      if (combinedFilters.status) {
        queryParams.append('status', combinedFilters.status)
      }
      
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
    } catch (_) {
      setError('Error de conexión al obtener gastos')
      setExpenses([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  const createExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<Expense>('/expenses', expenseData)

      if (response.success && response.data) {
        // Refetch to maintain consistency with server state
        await fetchExpenses()
        return response.data
      } else {
        setError(response.error || 'Error al crear gasto')
        return null
      }
    } catch (_) {
      setError('Error de conexión al crear gasto')
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchExpenses])

  const updateExpense = useCallback(async (id: string, expenseData: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>): Promise<Expense | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.patch<Expense>(`/expenses/${id}`, expenseData)

      if (response.success && response.data) {
        // Refetch to maintain consistency with server state
        await fetchExpenses()
        return response.data
      } else {
        setError(response.error || 'Error al actualizar gasto')
        return null
      }
    } catch (_) {
      setError('Error de conexión al actualizar gasto')
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchExpenses])

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.delete(`/expenses/${id}`)

      if (response.success) {
        // Refetch to maintain consistency with server state
        await fetchExpenses()
        return true
      } else {
        setError(response.error || 'Error al eliminar gasto')
        return false
      }
    } catch (_) {
      setError('Error de conexión al eliminar gasto')
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchExpenses])

  const markAsPaid = useCallback(async (id: string): Promise<boolean> => {
    return await updateExpense(id, { status: 'PAID' }) !== null
  }, [updateExpense])

  const refreshExpenses = useCallback(async () => {
    await fetchExpenses()
  }, [fetchExpenses])

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Update filters and refetch
  const updateFilters = useCallback((newFilters: UseExpensesParams) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  // Auto-fetch on mount and when filters or page changes
  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true)
      setError(null)

      try {
        const queryParams = new URLSearchParams()
        queryParams.append('page', currentPage.toString())
        queryParams.append('limit', '10')
        
        // Add filter parameters
        if (filters.search) {
          queryParams.append('search', filters.search)
        }
        if (filters.createdFrom) {
          queryParams.append('createdFrom', filters.createdFrom)
        }
        if (filters.createdTo) {
          queryParams.append('createdTo', filters.createdTo)
        }
        if (filters.dueFrom) {
          queryParams.append('dueFrom', filters.dueFrom)
        }
        if (filters.dueTo) {
          queryParams.append('dueTo', filters.dueTo)
        }
        if (filters.category) {
          queryParams.append('category', filters.category)
        }
        if (filters.frequency) {
          queryParams.append('frequency', filters.frequency)
        }
        if (filters.status) {
          queryParams.append('status', filters.status)
        }
        
        const response = await apiClient.get<{expenses: Expense[], pagination: PaginationData}>(`/expenses?${queryParams}`)
        console.log('expenses response', response)
        
        if (response.success && response.data) {
          setExpenses(response.data.expenses)
          setPagination(response.data.pagination)
        } else {
          setError(response.error || 'Error al obtener gastos')
          setExpenses([])
          setPagination(null)
        }
      } catch (_) {
        setError('Error de conexión al obtener gastos')
        setExpenses([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    }

    loadExpenses()
  }, [filters, currentPage]) // Dependencies are now direct state values, not functions

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
    currentPage,
    filters,
    setFilters: updateFilters
  }
}
