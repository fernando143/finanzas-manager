/**
 * Query API wrapper for TanStack React Query
 * Provides a thin wrapper around the existing apiClient to work seamlessly with React Query
 */

import { apiClient } from '../services/api/client.service'
import type { ApiResponse } from '../../types/api'

/**
 * Query function factory that throws errors for React Query error handling
 * React Query expects functions to throw errors rather than return error states
 */
export const queryApi = {
  /**
   * GET request wrapper for queries
   * Throws an error if the request fails for proper React Query error handling
   */
  async get<T>(endpoint: string, query?: Record<string, unknown>): Promise<T> {
    const response = await apiClient.get<T>(endpoint, query)
    
    if (!response.success) {
      throw new Error(response.error || 'Request failed')
    }
    
    if (response.data === undefined || response.data === null) {
      throw new Error('No data received from server')
    }
    
    return response.data
  },
  
  /**
   * POST request wrapper for mutations
   * Returns the full ApiResponse for mutation handlers
   */
  async post<T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    return apiClient.post<T>(endpoint, data)
  },
  
  /**
   * PUT request wrapper for mutations
   * Returns the full ApiResponse for mutation handlers
   */
  async put<T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    return apiClient.put<T>(endpoint, data)
  },
  
  /**
   * PATCH request wrapper for mutations
   * Returns the full ApiResponse for mutation handlers
   */
  async patch<T>(endpoint: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
    return apiClient.patch<T>(endpoint, data)
  },
  
  /**
   * DELETE request wrapper for mutations
   * Returns the full ApiResponse for mutation handlers
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiClient.delete<T>(endpoint)
  },
}

/**
 * Helper function to handle mutation responses
 * Throws an error if the mutation fails
 */
export function handleMutationResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || 'Mutation failed')
  }
  
  if (response.data === undefined || response.data === null) {
    throw new Error('No data received from server')
  }
  
  return response.data
}