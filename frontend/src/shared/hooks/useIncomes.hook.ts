import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api/client.service'
import type { Income } from '../../types/api'

interface UseIncomesReturn {
  incomes: Income[]
  loading: boolean
  error: string | null
  fetchIncomes: () => Promise<void>
  createIncome: (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Income | null>
  updateIncome: (id: string, income: Partial<Omit<Income, 'id' | 'userId' | 'createdAt'>>) => Promise<Income | null>
  deleteIncome: (id: string) => Promise<boolean>
  refreshIncomes: () => Promise<void>
}

export const useIncomes = (): UseIncomesReturn => {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIncomes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Fetching incomes...')
      const response = await apiClient.get<{ incomes: Income[] } >('/incomes')
      console.log('📥 Fetch incomes response:', response)

      if (response.success && response.data) {
        console.log('✅ Incomes fetched successfully:', response.data.incomes.length, 'items')
        setIncomes(response.data.incomes )
      } else {
        console.error('❌ Failed to fetch incomes:', response.error)
        setError(response.error || 'Error al obtener ingresos')
        setIncomes([])
      }
    } catch (err) {
      console.error('💥 Exception while fetching incomes:', err)
      setError('Error de conexión al obtener ingresos')
      setIncomes([])
    } finally {
      setLoading(false)
    }
  }, [])

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
    } catch (err) {
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
    } catch (err) {
      setError('Error de conexión al eliminar ingreso')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshIncomes = useCallback(async () => {
    await fetchIncomes()
  }, [fetchIncomes])

  // Auto-fetch on mount
  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])


  return {
    incomes,
    loading,
    error,
    fetchIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
    refreshIncomes
  }
}
