import request from 'supertest'
import app from '../src/app'

describe('Simple API Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('healthy')
    })

    it('should return API status', async () => {
      const response = await request(app)
        .get('/api/status')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Fianzas Manager API is running')
    })
  })

  describe('Authentication Required', () => {
    it('should require authentication for categories', async () => {
      const response = await request(app)
        .get('/api/categories')

      expect(response.status).toBe(401)
      expect(response.body.code).toBe('NO_TOKEN')
    })

    it('should require authentication for incomes', async () => {
      const response = await request(app)
        .get('/api/incomes')

      expect(response.status).toBe(401)
      expect(response.body.code).toBe('NO_TOKEN')
    })
  })
})