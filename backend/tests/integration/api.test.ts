import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../setup'

describe('API Integration Tests', () => {
  let authToken: string
  let userId: string

  beforeAll(async () => {
    // Crear usuario y obtener token de autenticación
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      })

    expect(registerResponse.status).toBe(201)
    authToken = registerResponse.body.data.token
    userId = registerResponse.body.data.user.id
  })

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'newuser@example.com',
            name: 'New User',
            password: 'password123'
          })

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.data.user.email).toBe('newuser@example.com')
        expect(response.body.data.token).toBeDefined()
      })

      it('should return error for duplicate email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            name: 'Duplicate User',
            password: 'password123'
          })

        expect(response.status).toBe(500)
        expect(response.body.success).toBeFalsy()
      })

      it('should return validation error for invalid data', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            name: '',
            password: '123'
          })

        expect(response.status).toBe(400)
        expect(response.body.code).toBe('VALIDATION_ERROR')
      })
    })

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.user.email).toBe('test@example.com')
        expect(response.body.data.token).toBeDefined()
      })

      it('should return error for invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })

        expect(response.status).toBe(500)
        expect(response.body.success).toBeFalsy()
      })
    })

    describe('GET /api/auth/me', () => {
      it('should return user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.user.email).toBe('test@example.com')
      })

      it('should return error without token', async () => {
        const response = await request(app)
          .get('/api/auth/me')

        expect(response.status).toBe(401)
        expect(response.body.code).toBe('NO_TOKEN')
      })

      it('should return error with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token')

        expect(response.status).toBe(401)
        expect(response.body.code).toBe('INVALID_TOKEN')
      })
    })
  })

  describe('Categories Endpoints', () => {
    describe('GET /api/categories', () => {
      it('should return categories with valid token', async () => {
        const response = await request(app)
          .get('/api/categories')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(Array.isArray(response.body.data.categories)).toBe(true)
        expect(response.body.data.categories.length).toBeGreaterThan(0)
      })

      it('should filter categories by type', async () => {
        const response = await request(app)
          .get('/api/categories?type=INCOME')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        
        const categories = response.body.data.categories
        expect(categories.every((cat: any) => cat.type === 'INCOME')).toBe(true)
      })

      it('should return error without authentication', async () => {
        const response = await request(app)
          .get('/api/categories')

        expect(response.status).toBe(401)
      })
    })

    describe('POST /api/categories', () => {
      it('should create a new category', async () => {
        const categoryData = {
          name: 'Test Category',
          type: 'INCOME',
          color: '#FF0000'
        }

        const response = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(categoryData)

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.data.category.name).toBe(categoryData.name)
        expect(response.body.data.category.type).toBe(categoryData.type)
        expect(response.body.data.category.userId).toBe(userId)
      })

      it('should return validation error for invalid data', async () => {
        const response = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: '',
            type: 'INVALID_TYPE'
          })

        expect(response.status).toBe(400)
        expect(response.body.code).toBe('VALIDATION_ERROR')
      })
    })
  })

  describe('Income Endpoints', () => {
    let testCategoryId: string

    beforeAll(async () => {
      // Crear categoría de ingresos para las pruebas
      const category = await prisma.category.create({
        data: {
          name: 'Test Income Category',
          type: 'INCOME',
          userId: userId,
        }
      })
      testCategoryId = category.id
    })

    describe('POST /api/incomes', () => {
      it('should create a new income', async () => {
        const incomeData = {
          description: 'Test Salary',
          amount: 5000,
          categoryId: testCategoryId,
          frequency: 'MONTHLY',
          incomeDate: new Date().toISOString(),
          isActive: true
        }

        const response = await request(app)
          .post('/api/incomes')
          .set('Authorization', `Bearer ${authToken}`)
          .send(incomeData)

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.data.income.description).toBe(incomeData.description)
        expect(response.body.data.income.amount).toBe(incomeData.amount)
      })

      it('should return validation error for invalid data', async () => {
        const response = await request(app)
          .post('/api/incomes')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: '',
            amount: -1000,
            categoryId: 'invalid-id'
          })

        expect(response.status).toBe(400)
        expect(response.body.code).toBe('VALIDATION_ERROR')
      })
    })

    describe('GET /api/incomes', () => {
      beforeAll(async () => {
        // Crear algunos ingresos de prueba
        const incomeData = {
          description: 'Test Income',
          amount: 1000,
          categoryId: testCategoryId,
          frequency: 'MONTHLY' as const,
          incomeDate: new Date().toISOString(),
          isActive: true
        }

        await request(app)
          .post('/api/incomes')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...incomeData, description: 'Income 1' })

        await request(app)
          .post('/api/incomes')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...incomeData, description: 'Income 2' })
      })

      it('should return user incomes', async () => {
        const response = await request(app)
          .get('/api/incomes')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(Array.isArray(response.body.data.incomes)).toBe(true)
        expect(response.body.data.incomes.length).toBeGreaterThan(0)
        
        // Verify pagination data
        expect(response.body.data.pagination).toBeDefined()
        expect(response.body.data.pagination.total).toBeGreaterThan(0)
      })

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/incomes?page=1&limit=1')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data.incomes.length).toBe(1)
        expect(response.body.data.pagination.limit).toBe(1)
      })
    })
  })

  describe('Health Check Endpoints', () => {
    describe('GET /api/health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/api/health')

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.status).toBe('healthy')
      })
    })

    describe('GET /api/status', () => {
      it('should return API status', async () => {
        const response = await request(app)
          .get('/api/status')

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('Fianzas Manager API is running')
        expect(response.body.version).toBe('1.0.0')
      })
    })
  })
})