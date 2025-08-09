import { z } from 'zod'

export const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida').max(255, 'La descripción es muy larga'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  frequency: z.enum(['ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUAL']),
  dueDate: z.string().optional().refine((val) => {
    if (!val) return true
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, 'Fecha inválida'),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL'])
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

export const defaultExpenseValues: ExpenseFormData = {
  description: '',
  amount: 0,
  categoryId: '',
  frequency: 'MONTHLY',
  dueDate: '',
  status: 'PENDING'
}