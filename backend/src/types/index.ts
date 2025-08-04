// Common types for the Fianzas Manager API

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Income {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'annual' | 'one-time';
  income_date?: Date; // When the income was/will be received (for chart positioning)
  nextDate?: Date; // When the next recurring payment is due (for scheduling)
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'annual' | 'one-time';
  dueDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  createdAt: Date;
  updatedAt: Date;
}