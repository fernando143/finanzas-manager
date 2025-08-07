import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from './shared/context'
import { useDataInitializer } from './shared/hooks'
import { queryClient } from './shared/config/query-client.config'
import { LoginForm } from './features/auth'
import { MainLayout } from './shared/ui/layouts'
import { Dashboard } from './features/dashboard'
import { CategoryManagement } from './features/categories/components'
import { TransactionList } from './shared/ui/components'
import { DueDatesCalendar } from './features/expenses/components'
import { Reports } from './features/reports'
import './App.css'

function AppContent() {
  const { user, isLoading } = useAuth()
  
  // Initialize example data when user logs in
  const { isInitializing, initializationError } = useDataInitializer()

  if (isLoading || (user && isInitializing)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading ? 'Cargando...' : 'Inicializando datos...'}
          </p>
          {initializationError && (
            <p className="mt-2 text-red-600 text-sm">{initializationError}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <LoginForm />
      } />
      
      {/* Protected routes */}
      <Route path="/*" element={
        !user ? (
          <Navigate to="/login" replace />
        ) : (
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/categories" element={<CategoryManagement />} />
              <Route path="/transactions" element={<TransactionList />} />
              <Route path="/due-dates" element={<DueDatesCalendar />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </MainLayout>
        )
      } />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <ReactQueryDevtools 
        initialIsOpen={false} 
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  )
}

export default App
