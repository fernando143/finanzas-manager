import { useEffect, useState } from 'react'
import { apiClient } from '../services/api/client.service'
import { useAuth } from '../context/Auth.context'

interface UseDataInitializerReturn {
  isInitializing: boolean
  isReady: boolean
  initializationError: string | null
}

export const useDataInitializer = (): UseDataInitializerReturn => {
  const { user } = useAuth()
  const [isInitializing, setIsInitializing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !isReady && !isInitializing) {
      initializeExampleData()
    }
  }, [user, isReady, isInitializing])

  const initializeExampleData = async () => {
    setIsInitializing(true)
    setInitializationError(null)
    
    try {
      // Check if categories already exist
      const categoriesResponse = await apiClient.get<any[]>('/categories')
      
      if (categoriesResponse.success && categoriesResponse.data && Array.isArray(categoriesResponse.data) && categoriesResponse.data.length === 0) {
        // Initialize income categories
        const incomeCategories = [
          { name: 'Sueldo', type: 'income' as const, color: '#10b981' },
          { name: 'Salario Base', type: 'income' as const, color: '#059669' },
          { name: 'Aguinaldo', type: 'income' as const, color: '#34d399' },
          { name: 'Prima Vacacional', type: 'income' as const, color: '#6ee7b7' },
          { name: 'Bonos y Comisiones', type: 'income' as const, color: '#3b82f6' },
          { name: 'Trabajo Extra', type: 'income' as const, color: '#60a5fa' },
          { name: 'Freelance', type: 'income' as const, color: '#93c5fd' },
          { name: 'Negocio Propio', type: 'income' as const, color: '#8b5cf6' },
          { name: 'Inversiones', type: 'income' as const, color: '#a78bfa' },
          { name: 'Dividendos', type: 'income' as const, color: '#c4b5fd' },
          { name: 'Alquileres', type: 'income' as const, color: '#f59e0b' },
          { name: 'Pensión', type: 'income' as const, color: '#fbbf24' },
          { name: 'Jubilación', type: 'income' as const, color: '#fcd34d' },
          { name: 'Apoyo Familiar', type: 'income' as const, color: '#ef4444' },
          { name: 'Prestamos Recibidos', type: 'income' as const, color: '#f87171' },
          { name: 'Ventas', type: 'income' as const, color: '#06b6d4' },
          { name: 'Reembolsos', type: 'income' as const, color: '#67e8f9' },
          { name: 'Otros Ingresos', type: 'income' as const, color: '#84cc16' }
        ]

        // Initialize expense categories
        const expenseCategories = [
          { name: 'Vivienda', type: 'expense' as const, color: '#ef4444' },
          { name: 'Renta/Hipoteca', type: 'expense' as const, color: '#dc2626' },
          { name: 'Predial', type: 'expense' as const, color: '#f87171' },
          { name: 'Mantenimiento Hogar', type: 'expense' as const, color: '#fca5a5' },
          { name: 'Alimentación', type: 'expense' as const, color: '#f97316' },
          { name: 'Supermercado', type: 'expense' as const, color: '#fb923c' },
          { name: 'Restaurantes', type: 'expense' as const, color: '#fdba74' },
          { name: 'Transporte', type: 'expense' as const, color: '#eab308' },
          { name: 'Gasolina', type: 'expense' as const, color: '#facc15' },
          { name: 'Transporte Público', type: 'expense' as const, color: '#fde047' },
          { name: 'Uber/Taxi', type: 'expense' as const, color: '#fef08a' },
          { name: 'Servicios', type: 'expense' as const, color: '#22c55e' },
          { name: 'Luz', type: 'expense' as const, color: '#4ade80' },
          { name: 'Agua', type: 'expense' as const, color: '#86efac' },
          { name: 'Gas', type: 'expense' as const, color: '#bbf7d0' },
          { name: 'Internet', type: 'expense' as const, color: '#06b6d4' },
          { name: 'Teléfono', type: 'expense' as const, color: '#22d3ee' },
          { name: 'Cable/Streaming', type: 'expense' as const, color: '#67e8f9' },
          { name: 'Salud', type: 'expense' as const, color: '#3b82f6' },
          { name: 'Médicos', type: 'expense' as const, color: '#60a5fa' },
          { name: 'Medicinas', type: 'expense' as const, color: '#93c5fd' },
          { name: 'Dentista', type: 'expense' as const, color: '#dbeafe' },
          { name: 'Educación', type: 'expense' as const, color: '#8b5cf6' },
          { name: 'Colegiaturas', type: 'expense' as const, color: '#a78bfa' },
          { name: 'Libros', type: 'expense' as const, color: '#c4b5fd' },
          { name: 'Cursos', type: 'expense' as const, color: '#e9d5ff' },
          { name: 'Entretenimiento', type: 'expense' as const, color: '#ec4899' },
          { name: 'Cine', type: 'expense' as const, color: '#f472b6' },
          { name: 'Conciertos', type: 'expense' as const, color: '#f9a8d4' },
          { name: 'Deportes', type: 'expense' as const, color: '#fbcfe8' },
          { name: 'Deudas', type: 'expense' as const, color: '#dc2626' },
          { name: 'Tarjetas de Crédito', type: 'expense' as const, color: '#b91c1c' },
          { name: 'Préstamos', type: 'expense' as const, color: '#991b1b' },
          { name: 'Seguros', type: 'expense' as const, color: '#6b7280' },
          { name: 'Seguro Auto', type: 'expense' as const, color: '#9ca3af' },
          { name: 'Seguro Vida', type: 'expense' as const, color: '#d1d5db' },
          { name: 'Seguro Gastos Médicos', type: 'expense' as const, color: '#e5e7eb' },
          { name: 'Ropa y Calzado', type: 'expense' as const, color: '#f59e0b' },
          { name: 'Cuidado Personal', type: 'expense' as const, color: '#fbbf24' },
          { name: 'Peluquería', type: 'expense' as const, color: '#fcd34d' },
          { name: 'Regalos', type: 'expense' as const, color: '#84cc16' },
          { name: 'Donaciones', type: 'expense' as const, color: '#a3e635' },
          { name: 'Impuestos', type: 'expense' as const, color: '#7c3aed' },
          { name: 'Multas', type: 'expense' as const, color: '#a855f7' },
          { name: 'Otros Gastos', type: 'expense' as const, color: '#64748b' }
        ]

        // Create all categories
        const allCategories = [...incomeCategories, ...expenseCategories]
        for (const category of allCategories) {
          await apiClient.post('/categories', category)
        }

        // Initialize example incomes
        const exampleIncomes = [
          {
            description: 'Salario Principal',
            amount: 45000,
            category: 'Salario',
            frequency: 'monthly' as const,
            nextDate: '2025-02-01'
          },
          {
            description: 'Freelance Desarrollo Web',
            amount: 8000,
            category: 'Trabajo Extra',
            frequency: 'monthly' as const,
            nextDate: '2025-02-15'
          },
          {
            description: 'Dividendos Inversiones',
            amount: 1500,
            category: 'Inversiones',
            frequency: 'monthly' as const,
            nextDate: '2025-02-20'
          }
        ]

        for (const income of exampleIncomes) {
          await apiClient.post('/incomes', income)
        }

        // Initialize example expenses
        const exampleExpenses = [
          {
            description: 'Alquiler Departamento',
            amount: 18000,
            category: 'Vivienda',
            frequency: 'monthly' as const,
            dueDate: '2025-02-05',
            status: 'pending' as const
          },
          {
            description: 'Tarjeta de Crédito',
            amount: 3500,
            category: 'Deudas',
            frequency: 'monthly' as const,
            dueDate: '2025-02-03',
            status: 'pending' as const
          },
          {
            description: 'Servicios Públicos',
            amount: 2800,
            category: 'Servicios',
            frequency: 'monthly' as const,
            dueDate: '2025-01-30',
            status: 'overdue' as const
          },
          {
            description: 'Seguro Auto',
            amount: 1200,
            category: 'Seguros',
            frequency: 'monthly' as const,
            dueDate: '2025-02-10',
            status: 'pending' as const
          },
          {
            description: 'Supermercado',
            amount: 4500,
            category: 'Alimentación',
            frequency: 'weekly' as const,
            dueDate: '2025-02-07',
            status: 'pending' as const
          }
        ]

        for (const expense of exampleExpenses) {
          await apiClient.post('/expenses', expense)
        }

        console.log('Example data initialized successfully')
      }
      
      // Mark as ready regardless of whether we created new data or data already existed
      setIsReady(true)
    } catch (error) {
      console.error('Error initializing example data:', error)
      setInitializationError('Error al inicializar datos de ejemplo')
      setIsReady(true) // Mark as ready even on error to prevent infinite loops
    } finally {
      setIsInitializing(false)
    }
  }

  return {
    isInitializing,
    isReady,
    initializationError
  }
}