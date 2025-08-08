import React, { useState, useRef, useEffect } from 'react';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useExpenseFiltersStore } from '../stores';

interface ExpenseFilterDropdownProps {
  loading?: boolean;
  className?: string;
}

export const ExpenseFilterDropdown: React.FC<ExpenseFilterDropdownProps> = ({
  loading = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get filter state and actions from Zustand store
  const filters = useExpenseFiltersStore(state => state.filters);
  const setSearchInput = useExpenseFiltersStore(state => state.setSearchInput);
  const executeSearch = useExpenseFiltersStore(state => state.executeSearch);
  const updateFilter = useExpenseFiltersStore(state => state.updateFilter);
  const clearFilters = useExpenseFiltersStore(state => state.clearFilters);
  const getActiveFilterCount = useExpenseFiltersStore(state => state.getActiveFilterCount);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleApplyFilters = () => {
    // Filters are already applied in real-time, just close the dropdown
    setIsOpen(false);
  };

  const handleSearch = () => {
    executeSearch();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateFilter('search', '');
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // Get active filter count from store
  const activeFiltersCount = getActiveFilterCount();

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <style>{`
        .filter-dropdown-container {
          position: relative;
          width: 100%;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 12px;
          height: 48px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .search-bar:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          color: #1f2937;
          background: transparent;
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .filter-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: ${isOpen ? '#3b82f6' : '#f3f4f6'};
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          color: ${isOpen ? '#ffffff' : '#4b5563'};
          flex-shrink: 0;
        }

        .filter-button:hover {
          background: ${isOpen ? '#2563eb' : '#e5e7eb'};
          color: ${isOpen ? '#ffffff' : '#1f2937'};
        }

        .filter-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filter-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 380px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          opacity: ${isOpen ? 1 : 0};
          transform: translateY(${isOpen ? '0' : '-10px'});
          pointer-events: ${isOpen ? 'auto' : 'none'};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .dropdown-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .clear-button {
          font-size: 13px;
          color: #3b82f6;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .clear-button:hover {
          background: #eff6ff;
        }

        .clear-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filter-group {
          margin-bottom: 20px;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 10px;
        }

        .date-range {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .date-input-wrapper {
          position: relative;
        }

        .date-input-label {
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 4px;
          display: block;
        }

        .filter-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: all 0.2s;
        }

        .filter-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .filter-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .apply-button {
          width: 100%;
          padding: 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .apply-button:hover {
          background: #2563eb;
        }

        .apply-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 24px 24px 0 0;
            padding: 24px;
            max-height: 80vh;
            overflow-y: auto;
          }

          .search-bar {
            padding: 0 10px;
            gap: 6px;
          }
          
          .search-input {
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          .filter-button {
            min-width: 44px !important;
            width: 44px !important;
            height: 44px !important;
            background: ${isOpen ? '#3b82f6' : '#f3f4f6'} !important;
            border: 1px solid ${isOpen ? '#2563eb' : '#e5e7eb'} !important;
          }

          .date-range {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>

      <div className="filter-dropdown-container">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por descripción..."
            value={filters.searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          {filters.searchInput && (
            <button
              onClick={handleClearSearch}
              className="flex items-center justify-center p-2 hover:bg-gray-100 rounded"
              disabled={loading}
              type="button"
              aria-label="Limpiar búsqueda"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
          <button
            onClick={handleSearch}
            className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ml-2"
            disabled={loading || filters.searchInput === filters.search}
            type="button"
            aria-label="Buscar"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          <button
            className="filter-button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading}
            aria-label="Abrir filtros"
          >
            <FunnelIcon className={`h-5 w-5 ${isOpen ? 'text-white' : 'text-gray-700'} flex-shrink-0`} />
            {activeFiltersCount > 0 && (
              <span className="filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        <div className="dropdown">
          <div className="dropdown-header">
            <span className="dropdown-title">Filtros Avanzados</span>
            <button
              className="clear-button"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Limpiar todo
            </button>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              Fecha de Creación
            </label>
            <div className="date-range">
              <div className="date-input-wrapper">
                <label className="date-input-label">Desde</label>
                <input
                  type="date"
                  className="filter-input"
                  value={filters.createdFrom}
                  onChange={(e) => updateFilter('createdFrom', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="date-input-wrapper">
                <label className="date-input-label">Hasta</label>
                <input
                  type="date"
                  className="filter-input"
                  value={filters.createdTo}
                  onChange={(e) => updateFilter('createdTo', e.target.value)}
                  min={filters.createdFrom}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              Fecha de Vencimiento
            </label>
            <div className="date-range">
              <div className="date-input-wrapper">
                <label className="date-input-label">Desde</label>
                <input
                  type="date"
                  className="filter-input"
                  value={filters.dueFrom}
                  onChange={(e) => updateFilter('dueFrom', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="date-input-wrapper">
                <label className="date-input-label">Hasta</label>
                <input
                  type="date"
                  className="filter-input"
                  value={filters.dueTo}
                  onChange={(e) => updateFilter('dueTo', e.target.value)}
                  min={filters.dueFrom}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button
            className="apply-button"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            <FunnelIcon className="h-4 w-4" />
            Aplicar filtros
          </button>

          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-500">Aplicando filtros...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilterDropdown;