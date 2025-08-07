import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../../../shared/hooks';
import { format } from 'date-fns';

export interface ExpenseFilterParams {
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  dueFrom?: string;
  dueTo?: string;
}

interface ExpenseFiltersProps {
  onFiltersChange: (filters: ExpenseFilterParams) => void;
  loading?: boolean;
  className?: string;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  onFiltersChange,
  loading = false,
  className = ''
}) => {
  // Get first day of current month in YYYY-MM-DD format
  const getFirstDayOfMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return format(firstDay, 'yyyy-MM-dd');
  };

  // State for all filter fields
  const [search, setSearch] = useState('');
  const [createdFrom, setCreatedFrom] = useState(getFirstDayOfMonth());
  const [createdTo, setCreatedTo] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  
  // Debounced search value
  const debouncedSearch = useDebounce(search, 500);
  
  // Track active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (search) count++;
    if (createdFrom !== getFirstDayOfMonth()) count++;
    if (createdTo) count++;
    if (dueFrom) count++;
    if (dueTo) count++;
    return count;
  };

  // Convert date to ISO string with GMT-3 noon (15:00 UTC)
  const toGMT3NoonISO = (dateString: string) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    date.setUTCHours(15, 0, 0, 0); // Set to 12:00 noon GMT-3 (15:00 UTC)
    return date.toISOString();
  };

  // Apply filters automatically when search changes (debounced)
  useEffect(() => {
    const filters: ExpenseFilterParams = {};
    
    // Only add filters that have values
    if (debouncedSearch) filters.search = debouncedSearch;
    if (createdFrom) filters.createdFrom = toGMT3NoonISO(createdFrom);
    if (createdTo) filters.createdTo = toGMT3NoonISO(createdTo);
    if (dueFrom) filters.dueFrom = toGMT3NoonISO(dueFrom);
    if (dueTo) filters.dueTo = toGMT3NoonISO(dueTo);
    
    onFiltersChange(filters);
  }, [debouncedSearch, createdFrom, createdTo, dueFrom, dueTo, onFiltersChange]);

  const handleApplyFilters = () => {
    const filters: ExpenseFilterParams = {};
    
    // Only add filters that have values
    if (debouncedSearch) filters.search = debouncedSearch;
    if (createdFrom) filters.createdFrom = toGMT3NoonISO(createdFrom);
    if (createdTo) filters.createdTo = toGMT3NoonISO(createdTo);
    if (dueFrom) filters.dueFrom = toGMT3NoonISO(dueFrom);
    if (dueTo) filters.dueTo = toGMT3NoonISO(dueTo);
    
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    const defaultCreatedFrom = getFirstDayOfMonth();
    setSearch('');
    setCreatedFrom(defaultCreatedFrom);
    setCreatedTo('');
    setDueFrom('');
    setDueTo('');
    
    // Apply default filter (first day of month)
    onFiltersChange({
      createdFrom: toGMT3NoonISO(defaultCreatedFrom)
    });
  };

  const handleDateChange = (field: string, value: string) => {
    switch(field) {
      case 'createdFrom':
        setCreatedFrom(value);
        break;
      case 'createdTo':
        setCreatedTo(value);
        break;
      case 'dueFrom':
        setDueFrom(value);
        break;
      case 'dueTo':
        setDueTo(value);
        break;
    }
  };

  // Apply filters when dates change
  const handleDateApply = () => {
    handleApplyFilters();
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`bg-white shadow rounded-lg p-4 mb-6 ${className}`}>
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descripción..."
            disabled={loading}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        {search && search.length < 2 && (
          <p className="mt-1 text-sm text-yellow-600">
            Mínimo 2 caracteres para buscar
          </p>
        )}
      </div>

      {/* Date Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Creation Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Creación
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="createdFrom" className="block text-xs text-gray-500 mb-1">
                Desde
              </label>
              <input
                type="date"
                id="createdFrom"
                value={createdFrom}
                onChange={(e) => handleDateChange('createdFrom', e.target.value)}
                onBlur={handleDateApply}
                disabled={loading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="createdTo" className="block text-xs text-gray-500 mb-1">
                Hasta
              </label>
              <input
                type="date"
                id="createdTo"
                value={createdTo}
                onChange={(e) => handleDateChange('createdTo', e.target.value)}
                onBlur={handleDateApply}
                min={createdFrom}
                disabled={loading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Due Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Vencimiento
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="dueFrom" className="block text-xs text-gray-500 mb-1">
                Desde
              </label>
              <input
                type="date"
                id="dueFrom"
                value={dueFrom}
                onChange={(e) => handleDateChange('dueFrom', e.target.value)}
                onBlur={handleDateApply}
                disabled={loading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="dueTo" className="block text-xs text-gray-500 mb-1">
                Hasta
              </label>
              <input
                type="date"
                id="dueTo"
                value={dueTo}
                onChange={(e) => handleDateChange('dueTo', e.target.value)}
                onBlur={handleDateApply}
                min={dueFrom}
                disabled={loading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </button>
          <button
            onClick={handleClearFilters}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar
          </button>
        </div>
        
        {activeFilterCount > 0 && (
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-3 text-center">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500">Aplicando filtros...</span>
        </div>
      )}
    </div>
  );
};

export default ExpenseFilters;