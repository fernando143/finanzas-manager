import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/client.service';
import { queryKeys } from '../lib/query-keys';
import type { Expense } from '../../types/api';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseExpensesParams {
  page?: number;
  limit?: number;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  dueFrom?: string;
  dueTo?: string;
  category?: string;
  frequency?: string;
  status?: string;
}

interface ExpensesResponse {
  expenses: Expense[];
  pagination: PaginationData;
}

// API functions
const fetchExpensesApi = async (filters: UseExpensesParams): Promise<ExpensesResponse> => {
  const queryParams = new URLSearchParams();
  
  // Add all filters to query params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const response = await apiClient.get<ExpensesResponse>(`/expenses?${queryParams}`);
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Error al obtener gastos');
  }
  
  return response.data;
};

const createExpenseApi = async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
  const response = await apiClient.post<Expense>('/expenses', expense);
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Error al crear gasto');
  }
  
  return response.data;
};

const updateExpenseApi = async ({ id, data }: { id: string; data: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>> }): Promise<Expense> => {
  const response = await apiClient.patch<Expense>(`/expenses/${id}`, data);
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Error al actualizar gasto');
  }
  
  return response.data;
};

const deleteExpenseApi = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`/expenses/${id}`);
  
  if (!response.success) {
    throw new Error(response.error || 'Error al eliminar gasto');
  }
};

// Main hook
export const useExpenses = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<UseExpensesParams>({});
  
  // Combined filters including page
  const queryFilters: UseExpensesParams = {
    ...filters,
    page: currentPage,
    limit: 10,
  };

  // Query for fetching expenses
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.expenses.list(queryFilters),
    queryFn: () => fetchExpensesApi(queryFilters),
    placeholderData: (previousData) => previousData,
  });

  // Mutation for creating expenses
  const createMutation = useMutation({
    mutationFn: createExpenseApi,
    onSuccess: () => {
      // Invalidate and refetch expenses list
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.lists() });
    },
  });

  // Mutation for updating expenses
  const updateMutation = useMutation({
    mutationFn: updateExpenseApi,
    onSuccess: () => {
      // Invalidate and refetch expenses list
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.lists() });
    },
  });

  // Mutation for deleting expenses
  const deleteMutation = useMutation({
    mutationFn: deleteExpenseApi,
    onSuccess: () => {
      // Invalidate and refetch expenses list
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.lists() });
    },
  });

  // Helper functions
  const createExpense = async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense | null> => {
    try {
      const result = await createMutation.mutateAsync(expenseData);
      return result;
    } catch (error) {
      console.error('Error creating expense:', error);
      return null;
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>): Promise<Expense | null> => {
    try {
      const result = await updateMutation.mutateAsync({ id, data: expenseData });
      return result;
    } catch (error) {
      console.error('Error updating expense:', error);
      return null;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  };

  const markAsPaid = async (id: string): Promise<boolean> => {
    const result = await updateExpense(id, { status: 'PAID' });
    return result !== null;
  };

  const refreshExpenses = async () => {
    await refetch();
  };

  const setPage = (page: number) => {
    setCurrentPage(page);
  };

  const updateFilters = (newFilters: UseExpensesParams) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Legacy fetchExpenses for compatibility
  const fetchExpenses = async (params?: UseExpensesParams) => {
    if (params?.page) {
      setCurrentPage(params.page);
    }
    if (params) {
      const { page: _page, ...filterParams } = params;
      setFilters(prev => ({ ...prev, ...filterParams }));
    }
    await refetch();
  };

  return {
    expenses: data?.expenses || [],
    loading: loading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: error?.message || createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message || null,
    pagination: data?.pagination || null,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid,
    refreshExpenses,
    setPage,
    currentPage,
    filters,
    setFilters: updateFilters,
  };
};