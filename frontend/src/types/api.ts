// API types for frontend

export type ApiResponse<T> ={
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type Income = {
  id: string;
  userId: string;
  description: string;
  amount: number;
  categoryId: string; // Changed from 'category' to 'categoryId' to match API
  category: Category; // Populated category object from the API
  frequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'ANNUAL' | 'ONE_TIME'; // Changed to uppercase to match API
  incomeDate: string; // Changed from 'income_date' to 'incomeDate' to match API (camelCase)
  nextDate?: string; // When the next recurring payment is due (for scheduling)
  createdAt: string;
  updatedAt: string;
}

export type Collector = {
  id: string;
  collectorId: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type Expense = {
  id: string;
  userId: string;
  description: string;
  amount: number;
  categoryId: string; // Changed from 'category' to 'categoryId' to match API
  category: Category; // Populated category object from the API
  frequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'ANNUAL' | 'ONE_TIME'; // Changed to uppercase to match API
  dueDate?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'; // Changed to uppercase to match backend API
  mercadoPagoPaymentId?: string; // For tracking MercadoPago payments
  collectorId?: string; // Foreign key to Collector
  collector?: Collector; // Populated collector object from the API
  createdAt: string;
  updatedAt: string;
}

export type SavingsGoal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  createdAt: string;
  updatedAt: string;
}

export type Category = {
  id: string;
  userId?: string;
  name: string;
  type: 'INCOME' | 'EXPENSE'; // Changed to uppercase to match backend API
  color?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}
