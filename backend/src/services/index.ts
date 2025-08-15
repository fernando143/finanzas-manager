// Database service
export { prisma, connectDatabase, disconnectDatabase, healthCheck } from './database.service'

// Auth service
export { authService } from './auth.service'

// Core financial services
export { incomeService } from './income.service'
export { expenseService } from './expense.service'
export { categoryService, CategoryError, CategoryErrorCode } from './category.service'

// Integration services
export { mercadoPagoService } from './mercadopago.service'

// Goal and planning services
export { savingsGoalService } from './savings-goal.service'

// Collector service
export { collectorService } from './collector.service'

// Re-export types from Prisma
export type { 
  User, 
  Category, 
  Income, 
  Expense, 
  SavingsGoal,
  Investment,
  Budget,
  Debt,
  Account,
  Collector,
  CategoryType,
  Frequency,
  ExpenseStatus,
  Priority,
  Timeframe,
  InvestmentType,
  BudgetPeriod,
  DebtType,
  PaymentStrategy,
  AccountType,
  Prisma
} from '@prisma/client'