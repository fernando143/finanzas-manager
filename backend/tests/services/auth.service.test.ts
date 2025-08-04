import { authService } from '../../src/services/auth.service'
import { prisma } from '../setup'

describe('AuthService', () => {
  const testUserData = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123'
  }

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register(testUserData)

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(testUserData.email)
      expect(result.user.name).toBe(testUserData.name)
      expect(result.user.id).toBeDefined()
      expect(result.token).toBeDefined()

      // Verify user was created in database
      const userInDb = await prisma.user.findUnique({
        where: { email: testUserData.email }
      })
      expect(userInDb).toBeTruthy()
      expect(userInDb?.name).toBe(testUserData.name)
    })

    it('should throw error if user already exists', async () => {
      // Create user first
      await authService.register(testUserData)

      // Try to register same user again
      await expect(authService.register(testUserData))
        .rejects.toThrow('User already exists with this email')
    })

    it('should create default account for new user', async () => {
      const result = await authService.register(testUserData)

      const defaultAccount = await prisma.account.findFirst({
        where: { userId: result.user.id }
      })

      expect(defaultAccount).toBeTruthy()
      expect(defaultAccount?.name).toBe('Cuenta Principal')
      expect(defaultAccount?.type).toBe('CHECKING')
      expect(defaultAccount?.balance.toNumber()).toBe(0)
    })
  })

  describe('login', () => {
    beforeEach(async () => {
      await authService.register(testUserData)
    })

    it('should login user with correct credentials', async () => {
      const result = await authService.login({
        email: testUserData.email,
        password: testUserData.password
      })

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(testUserData.email)
      expect(result.token).toBeDefined()
    })

    it('should throw error with incorrect email', async () => {
      await expect(authService.login({
        email: 'wrong@example.com',
        password: testUserData.password
      })).rejects.toThrow('Invalid email or password')
    })

    it('should throw error with incorrect password', async () => {
      await expect(authService.login({
        email: testUserData.email,
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid email or password')
    })
  })

  describe('verifyToken', () => {
    let userToken: string
    let userId: string

    beforeEach(async () => {
      const result = await authService.register(testUserData)
      userToken = result.token
      userId = result.user.id
    })

    it('should verify valid token', async () => {
      const decoded = await authService.verifyToken(userToken)

      expect(decoded.userId).toBe(userId)
      expect(decoded.email).toBe(testUserData.email)
    })

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyToken('invalid-token'))
        .rejects.toThrow('Invalid token')
    })
  })

  describe('getUserById', () => {
    let userId: string

    beforeEach(async () => {
      const result = await authService.register(testUserData)
      userId = result.user.id
    })

    it('should return user by id', async () => {
      const user = await authService.getUserById(userId)

      expect(user.id).toBe(userId)
      expect(user.email).toBe(testUserData.email)
      expect(user.name).toBe(testUserData.name)
    })

    it('should throw error for non-existent user', async () => {
      await expect(authService.getUserById('non-existent-id'))
        .rejects.toThrow('User not found')
    })
  })
})