import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api/client.service'
import type { Category } from '../../types/api'
import { useAuth } from '../context/Auth.context'

interface UseCategoriesReturn {
  categories: Category[]
  incomeCategories: Category[]
  expenseCategories: Category[]
  loading: boolean
  error: string | null
  fetchCategories: () => Promise<void>
  createCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Category | null>
  updateCategory: (id: string, category: Partial<Omit<Category, 'id' | 'userId' | 'createdAt'>>) => Promise<Category | null>
  deleteCategory: (id: string) => Promise<boolean>
  refreshCategories: () => Promise<void>
}

export const useCategories = (): UseCategoriesReturn => {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<{categories: Category[]}>('/categories')
      if (response.success && response.data) {
        setCategories(response.data.categories)
      } else {
        console.log('error al obtener categorias')
        setError(response.error || 'Error al obtener categorías')
        setCategories([])
      }
    } catch (err) {
      console.log(err)
      setError('Error de conexión al obtener categorías')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load categories on component mount (independent of user authentication)
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Retry mechanism when categories are empty (independent of user)
  useEffect(() => {
    if (categories.length === 0 && !loading && !error) {
      // Retry after a short delay to allow initialization to complete
      const retryTimer = setTimeout(() => {
        fetchCategories()
      }, 500)

      return () => clearTimeout(retryTimer)
    }
  }, [categories.length, loading, error, fetchCategories])

  const createCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Category | null> => {
    if (!user) {
      setError('Usuario no autenticado para crear categorías')
      return null
    }
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<Category>('/categories', categoryData)

      if (response.success && response.data) {
        // Optimistic update
        setCategories(prev => [...prev, response.data!])
        return response.data
      } else {
        setError(response.error || 'Error al crear categoría')
        return null
      }
    } catch (err) {
      setError('Error de conexión al crear categoría')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCategory = useCallback(async (id: string, categoryData: Partial<Omit<Category, 'id' | 'userId' | 'createdAt'>>): Promise<Category | null> => {
    if (!user) {
      setError('Usuario no autenticado para actualizar categorías')
      return null
    }
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.patch<Category>(`/categories/${id}`, categoryData)

      if (response.success && response.data) {
        // Optimistic update
        setCategories(prev => prev.map(category =>
          category.id === id ? response.data! : category
        ))
        return response.data
      } else {
        setError(response.error || 'Error al actualizar categoría')
        return null
      }
    } catch (err) {
      setError('Error de conexión al actualizar categoría')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado para eliminar categorías')
      return false
    }
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.delete(`/categories/${id}`)

      if (response.success) {
        // Optimistic update
        setCategories(prev => prev.filter(category => category.id !== id))
        return true
      } else {
        setError(response.error || 'Error al eliminar categoría')
        return false
      }
    } catch (err) {
      setError('Error de conexión al eliminar categoría')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshCategories = useCallback(async () => {
    await fetchCategories()
  }, [fetchCategories])

  // Filtered categories by type
  const incomeCategories = categories.filter(cat => cat.type === 'INCOME')
  const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE')

  // Clear categories only when user explicitly logs out (not on initial load)
  useEffect(() => {
    // Only clear categories if we had a user before and now we don't
    // This prevents clearing on initial load when user is still null
    const currentUser = user
    const previousUser = categories.length > 0 // If we have categories, we likely had a user

    if (previousUser && !currentUser) {
      // User logged out, clear categories
      setCategories([])
    }
  }, [user, categories.length])

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories
  }
}
