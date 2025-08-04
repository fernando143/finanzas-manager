import { PrismaClient } from '../generated/prisma'

// Configuración del cliente Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
})

// Middleware para logging
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  
  console.log(`📊 Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

// Función de conexión
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Ejecutar una consulta de prueba
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database health check passed')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// Función de desconexión
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error)
  }
}

// Función de health check
export const healthCheck = async (): Promise<{ status: string; timestamp: string; error?: string }> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    return { status: 'unhealthy', error: (error as Error).message, timestamp: new Date().toISOString() }
  }
}

// Manejar shutdown gracefully
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, closing database connection...')
  disconnectDatabase().finally(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, closing database connection...')
  disconnectDatabase().finally(() => process.exit(0))
})

export { prisma }
export default prisma