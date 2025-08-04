import { incomeService } from '../../src/services/income.service'
import { authService } from '../../src/services/auth.service'
import { prisma } from '../setup'

describe('IncomeService', () => {
  let testUserId: string
  let testCategoryId: string

  beforeEach(async () => {
    // Crear usuario de prueba
    const userResult = await authService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })
    testUserId = userResult.user.id

    // Crear categoría de prueba
    const category = await prisma.category.create({
      data: {
        name: 'Test Income Category',
        type: 'INCOME',
        userId: testUserId,
      }
    })
    testCategoryId = category.id
  })

  const validIncomeData = {
    description: 'Test Salary',
    amount: 5000,
    categoryId: '',
    frequency: 'MONTHLY' as const,
    incomeDate: new Date().toISOString(),
    isActive: true,
  }

  describe('create', () => {
    it('should create an income successfully', async () => {
      const incomeData = { ...validIncomeData, categoryId: testCategoryId }
      
      const income = await incomeService.create(testUserId, incomeData)

      expect(income.id).toBeDefined()
      expect(income.description).toBe(incomeData.description)
      expect(income.amount.toNumber()).toBe(incomeData.amount)
      expect(income.frequency).toBe(incomeData.frequency)
      expect(income.userId).toBe(testUserId)
      expect(income.category).toBeDefined()
      expect(income.category.id).toBe(testCategoryId)
    })

    it('should throw error for non-existent category', async () => {
      const incomeData = { ...validIncomeData, categoryId: 'non-existent-id' }
      
      await expect(incomeService.create(testUserId, incomeData))
        .rejects.toThrow('Category not found or not accessible')
    })

    it('should throw error for wrong category type', async () => {
      // Crear categoría de gastos
      const expenseCategory = await prisma.category.create({
        data: {
          name: 'Test Expense Category',
          type: 'EXPENSE',
          userId: testUserId,
        }
      })

      const incomeData = { ...validIncomeData, categoryId: expenseCategory.id }
      
      await expect(incomeService.create(testUserId, incomeData))
        .rejects.toThrow('Category not found or not accessible')
    })
  })

  describe('findMany', () => {
    beforeEach(async () => {
      // Crear varios ingresos de prueba
      const incomeData = { ...validIncomeData, categoryId: testCategoryId }
      
      await incomeService.create(testUserId, { ...incomeData, description: 'Income 1', amount: 1000 })
      await incomeService.create(testUserId, { ...incomeData, description: 'Income 2', amount: 2000 })
      await incomeService.create(testUserId, { ...incomeData, description: 'Income 3', amount: 3000 })
    })

    it('should return all user incomes', async () => {
      const incomes = await incomeService.findMany(testUserId)

      expect(incomes).toHaveLength(3)
      expect(incomes.every(income => income.userId === testUserId)).toBe(true)
    })

    it('should respect pagination', async () => {
      const incomes = await incomeService.findMany(testUserId, {
        skip: 1,
        take: 1,
      })

      expect(incomes).toHaveLength(1)
    })

    it('should filter by category', async () => {
      const incomes = await incomeService.findMany(testUserId, {
        where: { categoryId: testCategoryId }
      })

      expect(incomes).toHaveLength(3)
      expect(incomes.every(income => income.categoryId === testCategoryId)).toBe(true)
    })
  })

  describe('findById', () => {
    let testIncomeId: string

    beforeEach(async () => {
      const incomeData = { ...validIncomeData, categoryId: testCategoryId }
      const income = await incomeService.create(testUserId, incomeData)
      testIncomeId = income.id
    })

    it('should return income by id', async () => {
      const income = await incomeService.findById(testUserId, testIncomeId)

      expect(income).toBeTruthy()
      expect(income?.id).toBe(testIncomeId)
      expect(income?.userId).toBe(testUserId)
    })

    it('should return null for non-existent income', async () => {
      const income = await incomeService.findById(testUserId, 'non-existent-id')

      expect(income).toBeNull()
    })

    it('should return null for income belonging to different user', async () => {
      // Crear otro usuario
      const otherUserResult = await authService.register({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      })

      const income = await incomeService.findById(otherUserResult.user.id, testIncomeId)

      expect(income).toBeNull()
    })
  })

  describe('update', () => {
    let testIncomeId: string

    beforeEach(async () => {
      const incomeData = { ...validIncomeData, categoryId: testCategoryId }
      const income = await incomeService.create(testUserId, incomeData)
      testIncomeId = income.id
    })

    it('should update income successfully', async () => {
      const updateData = {
        description: 'Updated Salary',
        amount: 6000,
      }

      const updatedIncome = await incomeService.update(testUserId, testIncomeId, updateData)

      expect(updatedIncome.description).toBe(updateData.description)
      expect(updatedIncome.amount.toNumber()).toBe(updateData.amount)
    })

    it('should throw error for non-existent income', async () => {
      await expect(incomeService.update(testUserId, 'non-existent-id', { description: 'Test' }))
        .rejects.toThrow('Income not found')
    })
  })

  describe('delete', () => {
    let testIncomeId: string

    beforeEach(async () => {
      const incomeData = { ...validIncomeData, categoryId: testCategoryId }
      const income = await incomeService.create(testUserId, incomeData)
      testIncomeId = income.id
    })

    it('should delete income successfully', async () => {
      await incomeService.delete(testUserId, testIncomeId)

      const income = await incomeService.findById(testUserId, testIncomeId)
      expect(income).toBeNull()
    })

    it('should throw error for non-existent income', async () => {
      await expect(incomeService.delete(testUserId, 'non-existent-id'))
        .rejects.toThrow('Income not found')
    })
  })

  describe('search', () => {
    beforeEach(async () => {
      const incomeData = { ...validIncomeData, categoryId: testCategoryId }
      
      await incomeService.create(testUserId, { ...incomeData, description: 'Monthly Salary' })
      await incomeService.create(testUserId, { ...incomeData, description: 'Bonus Payment' })
      await incomeService.create(testUserId, { ...incomeData, description: 'Freelance Work' })
    })

    it('should search incomes by description', async () => {
      const results = await incomeService.search(testUserId, 'salary')

      expect(results).toHaveLength(1)
      expect(results[0].description).toContain('Salary')
    })

    it('should return empty array for no matches', async () => {
      const results = await incomeService.search(testUserId, 'nonexistent')

      expect(results).toHaveLength(0)
    })
  })
})