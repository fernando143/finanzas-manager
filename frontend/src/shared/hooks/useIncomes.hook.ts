import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api/client.service'
import type { Income } from '../../types/api'

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

interface UseIncomesParams {
  page?: number
  limit?: number
}

interface UseIncomesReturn {
  incomes: Income[]
  loading: boolean
  error: string | null
  pagination: PaginationData | null
  fetchIncomes: (params?: UseIncomesParams) => Promise<void>
  createIncome: (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Income | null>
  updateIncome: (id: string, income: Partial<Omit<Income, 'id' | 'userId' | 'createdAt'>>) => Promise<Income | null>
  deleteIncome: (id: string) => Promise<boolean>
  refreshIncomes: () => Promise<void>
  setPage: (page: number) => void
  currentPage: number
}

export const useIncomes = (): UseIncomesReturn => {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchIncomes = useCallback(async (params?: UseIncomesParams) => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Fetching incomes...')
      const queryParams = new URLSearchParams()
      const page = params?.page || currentPage
      const limit = params?.limit || 10
      
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      
      const response = await apiClient.get<{ incomes: Income[], pagination: PaginationData }>(`/incomes?${queryParams}`)
      console.log('📥 Fetch incomes response:', response)

      if (response.success && response.data) {
        console.log('✅ Incomes fetched successfully:', response.data.incomes.length, 'items')
        setIncomes(response.data.incomes)
        setPagination(response.data.pagination)
        if (params?.page) {
          setCurrentPage(params.page)
        }
      } else {
        console.error('❌ Failed to fetch incomes:', response.error)
        setError(response.error || 'Error al obtener ingresos')
        setIncomes([])
        setPagination(null)
      }
    } catch (err) {
      console.error('💥 Exception while fetching incomes:', err)
      setError('Error de conexión al obtener ingresos')
      setIncomes([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  const createIncome = useCallback(async (incomeData: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Income | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Creating income with data:', incomeData)
      const response = await apiClient.post<Income>('/incomes', incomeData)
      console.log('📥 API response:', response)

      if (response.success && response.data) {
        console.log('✅ Income created successfully:', response.data)
        // Optimistic update
        setIncomes(prev => {
          const updated = [response.data!, ...prev]
          console.log('📊 Updated incomes list:', updated.length, 'items')
          return updated
        })
        return response.data
      } else {
        console.error('❌ Failed to create income:', response.error)
        setError(response.error || 'Error al crear ingreso')
        return null
      }
    } catch (err) {
      console.error('💥 Exception while creating income:', err)
      setError('Error de conexión al crear ingreso')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateIncome = useCallback(async (id: string, incomeData: Partial<Omit<Income, 'id' | 'userId' | 'createdAt'>>): Promise<Income | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.patch<Income>(`/incomes/${id}`, incomeData)

      if (response.success && response.data) {
        // Optimistic update
        setIncomes(prev => prev.map(income =>
          income.id === id ? response.data! : income
        ))
        return response.data
      } else {
        setError(response.error || 'Error al actualizar ingreso')
        return null
      }
    } catch (_) {
      setError('Error de conexión al actualizar ingreso')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteIncome = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.delete(`/incomes/${id}`)

      if (response.success) {
        // Optimistic update
        setIncomes(prev => prev.filter(income => income.id !== id))
        return true
      } else {
        setError(response.error || 'Error al eliminar ingreso')
        return false
      }
    } catch (_) {
      setError('Error de conexión al eliminar ingreso')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshIncomes = useCallback(async () => {
    await fetchIncomes()
  }, [fetchIncomes])

  const setPage = useCallback((page: number) => {
    fetchIncomes({ page })
  }, [fetchIncomes])

  // Auto-fetch on mount
  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  return {
    incomes,
    loading,
    error,
    pagination,
    fetchIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
    refreshIncomes,
    setPage,
    currentPage
  }
}
