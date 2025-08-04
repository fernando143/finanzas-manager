import { useState, useCallback } from 'react'
import type { ApiResponse } from '../../types/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (apiCall: () => Promise<ApiResponse<T>>) => Promise<T | null>
  reset: () => void
}

export const useApi = <T>(): UseApiReturn<T> => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await apiCall()
      
      if (response.success && response.data !== undefined) {
        setState({
          data: response.data,
          loading: false,
          error: null
        })
        return response.data
      } else {
        const errorMessage = response.error || 'Error desconocido'
        setState({
          data: null,
          loading: false,
          error: errorMessage
        })
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión'
      setState({
        data: null,
        loading: false,
        error: errorMessage
      })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}