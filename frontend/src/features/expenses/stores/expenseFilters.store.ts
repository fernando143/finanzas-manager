import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface ExpenseFilterState {
  search: string;  // Real search filter (triggers query)
  searchInput: string;  // Temporary search input value
  createdFrom: string;
  createdTo: string;
  dueFrom: string;
  dueTo: string;
}

export interface ExpenseFiltersStore {
  // Filter state
  filters: ExpenseFilterState;
  
  // Pagination state
  currentPage: number;
  
  // Actions
  updateFilter: <K extends keyof ExpenseFilterState>(key: K, value: ExpenseFilterState[K]) => void;
  setSearchInput: (value: string) => void;  // Update temporary search input
  executeSearch: () => void;  // Copy searchInput to search (execute search)
  setFilters: (filters: Partial<ExpenseFilterState>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  resetPage: () => void;
  
  // Computed getters
  getActiveFilterCount: () => number;
  getApiParams: () => Record<string, string>;
  hasActiveFilters: () => boolean;
}

// Initial state
const initialFilterState: ExpenseFilterState = {
  search: '',
  searchInput: '',
  createdFrom: '',
  createdTo: '',
  dueFrom: '',
  dueTo: '',
};

// Convert date to ISO string with GMT-3 noon (15:00 UTC)
const toGMT3NoonISO = (dateString: string): string | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  date.setUTCHours(15, 0, 0, 0); // Set to 12:00 noon GMT-3 (15:00 UTC)
  return date.toISOString();
};

// Create store with devtools for debugging
export const useExpenseFiltersStore = create<ExpenseFiltersStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      filters: initialFilterState,
      currentPage: 1,
      
      // Update single filter
      updateFilter: (key, value) => {
        // Don't reset page for searchInput changes
        if (key === 'searchInput') {
          set((state) => ({
            filters: { ...state.filters, [key]: value },
          }), false, `updateFilter:${key}`);
        } else {
          set((state) => ({
            filters: { ...state.filters, [key]: value },
            currentPage: 1, // Reset to first page when filters change
          }), false, `updateFilter:${key}`);
        }
      },
      
      // Update temporary search input (doesn't trigger query)
      setSearchInput: (value) => 
        set((state) => ({
          filters: { ...state.filters, searchInput: value },
        }), false, 'setSearchInput'),
      
      // Execute search (copy searchInput to search)
      executeSearch: () => 
        {
          console.log('execute')
          set((state) => ({
          filters: { ...state.filters, search: state.filters.searchInput },
          currentPage: 1, // Reset to first page when executing search
        }), false, 'executeSearch')},
      
      // Update multiple filters at once
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1, // Reset to first page when filters change
        }), false, 'setFilters'),
      
      // Clear all filters
      clearFilters: () =>
        set({
          filters: initialFilterState,
          currentPage: 1,
        }, false, 'clearFilters'),
      
      // Set current page
      setPage: (page) =>
        set({ currentPage: page }, false, `setPage:${page}`),
      
      // Reset to first page
      resetPage: () =>
        set({ currentPage: 1 }, false, 'resetPage'),
      
      // Get count of active filters (excluding searchInput)
      getActiveFilterCount: () => {
        const { filters } = get();
        const { searchInput: _ignored, ...realFilters } = filters;
        return Object.values(realFilters).filter(value => value !== '').length;
      },
      
      // Get API parameters with proper formatting
      getApiParams: () => {
        const { filters, currentPage } = get();
        const params: Record<string, string> = {};
        
        // // Add page
        params.page = String(currentPage);
        
        
        if (filters.search) {
          params.search = filters.search;
        }
        
        
        if (filters.createdFrom) {
          const isoDate = toGMT3NoonISO(filters.createdFrom);
          if (isoDate) params.createdFrom = isoDate;
        }
        
        if (filters.createdTo) {
          const isoDate = toGMT3NoonISO(filters.createdTo);
          if (isoDate) params.createdTo = isoDate;
        }
        
        if (filters.dueFrom) {
          const isoDate = toGMT3NoonISO(filters.dueFrom);
          if (isoDate) params.dueFrom = isoDate;
        }
        
        if (filters.dueTo) {
          const isoDate = toGMT3NoonISO(filters.dueTo);
          if (isoDate) params.dueTo = isoDate;
        }
        
        return params;
      },
      
      // Check if any filters are active (excluding searchInput)
      hasActiveFilters: () => {
        const { filters } = get();
        const { searchInput: _ignored, ...realFilters } = filters;
        return Object.values(realFilters).some(value => value !== '');
      },
    }),
    {
      name: 'expense-filters', // Name for DevTools
    }
  )
);

// Selector hooks for performance optimization
export const useExpenseSearch = () => useExpenseFiltersStore((state) => state.filters.search);
export const useExpenseSearchInput = () => useExpenseFiltersStore((state) => state.filters.searchInput);
export const useExpenseCreatedDateRange = () => useExpenseFiltersStore((state) => ({
  from: state.filters.createdFrom,
  to: state.filters.createdTo,
}));
export const useExpenseDueDateRange = () => useExpenseFiltersStore((state) => ({
  from: state.filters.dueFrom,
  to: state.filters.dueTo,
}));
export const useExpensePage = () => useExpenseFiltersStore((state) => state.currentPage);