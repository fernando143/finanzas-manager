import { QueryClient } from '@tanstack/react-query'

/**
 * Create and configure the TanStack Query Client with optimized defaults
 * according to the PRD specifications
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Number of retries for failed queries
        retry: 3,
        // Exponential backoff with max delay of 30 seconds
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Data is considered stale after 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache is garbage collected after 10 minutes
        gcTime: 10 * 60 * 1000,
        // Don't refetch on window focus to reduce unnecessary requests
        refetchOnWindowFocus: false,
        // Keep previous data when refetching
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Only retry mutations once
        retry: 1,
        // Retry delay for mutations
        retryDelay: 1000,
      },
    },
  })
}

// Create a singleton instance
export const queryClient = createQueryClient()