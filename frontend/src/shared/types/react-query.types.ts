/**
 * TypeScript type definitions for TanStack React Query integration
 */

import type { 
  UseQueryOptions, 
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  QueryKey
} from '@tanstack/react-query'
import type { ApiResponse } from '../../types/api'

/**
 * Custom error type for query and mutation errors
 */
export interface QueryError {
  message: string
  code?: string
  details?: unknown
}

/**
 * Pagination info for list queries
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

/**
 * Infinite query page params
 */
export interface InfiniteQueryPageParam {
  page: number
  limit: number
}

/**
 * Custom query options with simplified typing
 */
export type CustomQueryOptions<
  TData = unknown,
  TError = QueryError,
  TSelect = TData
> = Omit<
  UseQueryOptions<TData, TError, TSelect>,
  'queryKey' | 'queryFn'
>

/**
 * Custom mutation options with simplified typing
 */
export type CustomMutationOptions<
  TData = unknown,
  TError = QueryError,
  TVariables = void,
  TContext = unknown
> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationFn'
>

/**
 * Custom infinite query options with simplified typing
 */
export type CustomInfiniteQueryOptions<
  TData = unknown,
  TError = QueryError
> = Omit<
  UseInfiniteQueryOptions<TData, TError, TData, TData extends readonly unknown[] ? TData : readonly unknown[], QueryKey>,
  'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam' | 'initialPageParam'
>

/**
 * Query metadata for debugging and DevTools
 */
export interface QueryMeta {
  module: string
  operation: 'list' | 'detail' | 'search' | 'aggregate' | 'custom'
  filters?: Record<string, unknown>
  timestamp?: number
}

/**
 * Mutation metadata for debugging and DevTools
 */
export interface MutationMeta {
  module: string
  operation: 'create' | 'update' | 'delete' | 'custom'
  invalidates?: QueryKey[]
  optimistic?: boolean
  timestamp?: number
}

/**
 * Helper type for extracting data from ApiResponse
 */
export type ExtractApiData<T> = T extends ApiResponse<infer U> ? U : T

/**
 * Helper type for mutation variables
 */
export interface MutationVariables<T = unknown> {
  id?: string
  data: T
}

/**
 * Standard query result with loading states
 */
export interface QueryResult<T> {
  data: T | undefined
  error: QueryError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isFetching: boolean
  refetch: () => void
}

/**
 * Standard mutation result with states
 */
export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  data: TData | undefined
  error: QueryError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isIdle: boolean
  reset: () => void
}

/**
 * Export common React Query types for convenience
 */
export type {
  UseQueryResult,
  UseMutationResult,
  UseInfiniteQueryResult,
  QueryKey
}