import { useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { Expense } from "../../../types/api";
import { ExpenseForm } from "./ExpenseForm.component";
import { ExpenseFilters, type ExpenseFilterParams } from "./ExpenseFilters.component";
import { useExpenses } from "../../../shared/hooks";
import { Pagination } from "../../../shared/ui/components";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrencyARS } from "../../../shared/utils";

export const ExpenseList = () => {
  const {
    expenses,
    loading,
    error,
    pagination,
    createExpense,
    updateExpense,
    deleteExpense,
    setPage,
    currentPage,
    setFilters,
  } = useExpenses();
  console.log("expenses", expenses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(
    undefined,
  );

  const handleFiltersChange = (filters: ExpenseFilterParams) => {
    setFilters(filters);
  };

  const handleSaveExpense = async (
    expenseData: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">,
  ) => {
    let success = false;

    if (editingExpense) {
      const result = await updateExpense(editingExpense.id, expenseData);
      success = result !== null;
    } else {
      const result = await createExpense(expenseData);
      success = result !== null;
    }

    if (success) {
      setEditingExpense(undefined);
      setIsFormOpen(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este egreso?")) {
      await deleteExpense(id);
    }
  };


  const formatFrequency = (frequency: string) => {
    switch (frequency.toUpperCase()) {
      case "WEEKLY":
        return "Semanal";
      case "BIWEEKLY":
        return "Quincenal";
      case "MONTHLY":
        return "Mensual";
      case "ANNUAL":
        return "Anual";
      case "ONE_TIME":
        return "Una vez";
      default:
        return frequency;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OVERDUE":
        return "text-red-600 bg-red-50";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      case "PAID":
        return "text-green-600 bg-green-50";
      case "PARTIAL":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case "OVERDUE":
        return "Vencido";
      case "PENDING":
        return "Pendiente";
      case "PAID":
        return "Pagado";
      case "PARTIAL":
        return "Parcial";
      default:
        return status;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Gestión de Egresos
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra tus gastos y pagos recurrentes y únicos.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            disabled={loading}
            className="flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Egreso
          </button>
        </div>
      </div>

      {/* Expense Filters */}
      <ExpenseFilters 
        onFiltersChange={handleFiltersChange}
        loading={loading}
        className="mt-6"
      />

      {/* Error alert */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar gastos
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando gastos...</p>
        </div>
      )}

      {/* Expense list */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Frecuencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.description}
                          {expense.mercadoPagoPaymentId && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              MP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {expense.categoryId || "Sin categoría"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">
                          {formatCurrencyARS(expense.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatFrequency(expense.frequency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.dueDate
                          ? format(parseISO(expense.dueDate), "dd MMM yyyy", {
                              locale: es,
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}
                        >
                          {getStatusText(expense.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No se encontraron egresos con los filtros aplicados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={setPage}
          loading={loading}
        />
      )}

      <ExpenseForm
        expense={editingExpense}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpense(undefined);
        }}
        onSave={handleSaveExpense}
      />
    </div>
  );
};

// Default export for lazy loading
export default ExpenseList;
