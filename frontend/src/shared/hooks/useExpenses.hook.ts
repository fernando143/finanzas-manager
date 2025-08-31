import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/client.service';
import { queryKeys } from '../lib/query-keys';
import type { Expense } from '../../types/api';
import { useExpenseFiltersStore } from '../../features/expenses/stores';

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

const createExpenseApi = async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'> & { recurrenceCount?: number }): Promise<Expense | Expense[]> => {
  // Usar endpoint batch si:
  // 1. recurrenceCount > 1 (múltiples recurrencias especificadas) O
  // 2. recurrenceCount es undefined Y frequency no es ONE_TIME (crear hasta fin de año)
  const shouldUseBatch = 
    (expense.recurrenceCount && expense.recurrenceCount > 1) ||
    (expense.recurrenceCount === undefined && expense.frequency !== 'ONE_TIME');
  
  if (shouldUseBatch) {
    const response = await apiClient.post<{ expenses: Expense[], summary: { created: number, total: number } }>('/expenses/batch', expense);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al crear gastos recurrentes');
    }
    
    return response.data.expenses;
  }
  
  // Si no, usar endpoint individual
  const { recurrenceCount, ...expenseWithoutRecurrence } = expense;
  const response = await apiClient.post<Expense>('/expenses', expenseWithoutRecurrence);
  
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Error al crear gasto');
  }
  
  return response.data;
};

const updateExpenseApi = async ({ id, data }: { id: string; data: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt' | 'category'>> }): Promise<Expense> => {
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

// Convert date to ISO string with GMT-3 noon (15:00 UTC)
const toGMT3NoonISO = (dateString: string): string | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  date.setUTCHours(15, 0, 0, 0); // Set to 12:00 noon GMT-3 (15:00 UTC)
  return date.toISOString();
};

// Main hook
export const useExpenses = () => {
  const queryClient = useQueryClient();
  
  // Subscribe to individual filter properties for fine-grained reactivity
  const search = useExpenseFiltersStore(state => state.filters.search);
  const createdFrom = useExpenseFiltersStore(state => state.filters.createdFrom);
  const createdTo = useExpenseFiltersStore(state => state.filters.createdTo);
  const dueFrom = useExpenseFiltersStore(state => state.filters.dueFrom);
  const dueTo = useExpenseFiltersStore(state => state.filters.dueTo);
  const currentPage = useExpenseFiltersStore(state => state.currentPage);
  
  // Build API params directly from individual subscriptions
  const apiParams: UseExpensesParams = {
    page: currentPage,
  };
  
  if (search) {
    apiParams.search = search;
  }
  
  if (createdFrom) {
    const isoDate = toGMT3NoonISO(createdFrom);
    if (isoDate) apiParams.createdFrom = isoDate;
  }
  
  if (createdTo) {
    const isoDate = toGMT3NoonISO(createdTo);
    if (isoDate) apiParams.createdTo = isoDate;
  }
  
  if (dueFrom) {
    const isoDate = toGMT3NoonISO(dueFrom);
    if (isoDate) apiParams.dueFrom = isoDate;
  }
  
  if (dueTo) {
    const isoDate = toGMT3NoonISO(dueTo);
    if (isoDate) apiParams.dueTo = isoDate;
  }
  
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.expenses.list(apiParams),
    queryFn: () => fetchExpensesApi(apiParams),
  });

  
  const createMutation = useMutation({
    mutationFn: createExpenseApi,
    onSuccess: () => {
      // Invalidate and refetch expenses list
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.lists() });
    },
  });

  
  const updateMutation = useMutation({
    mutationFn: updateExpenseApi,
    onSuccess: () => {
      // Invalidate and refetch expenses list
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.lists() });
    },
  });

  
  const deleteMutation = useMutation({
    mutationFn: deleteExpenseApi,
    onSuccess: () => {
      // Invalidate and refetch expenses list
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.lists() });
    },
  });

  
  const createExpense = async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'> & { recurrenceCount?: number }): Promise<Expense | Expense[] | null> => {
    try {
      const result = await createMutation.mutateAsync(expenseData);
      return result;
    } catch (error) {
      console.error('Error creating expense:', error);
      return null;
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt' | 'category'>>): Promise<Expense | null> => {
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

  return {
    expenses: data?.expenses || [],
    loading: isLoading || isFetching || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: error?.message || createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message || null,
    pagination: data?.pagination || null,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid,
    refreshExpenses,
  };
};