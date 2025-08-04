// Database service
export { prisma, connectDatabase, disconnectDatabase, healthCheck } from './database.service'

// Auth service
export { authService } from './auth.service'

// Core financial services
export { incomeService } from './income.service'
export { expenseService } from './expense.service'
export { categoryService } from './category.service'

// Goal and planning services
export { savingsGoalService } from './savings-goal.service'

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
} from '../generated/prisma'