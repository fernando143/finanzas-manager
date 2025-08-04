import { PrismaClient } from '../src/generated/prisma'

// Configurar base de datos de pruebas
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://fianzas_user:fianzas_secure_password_2024@localhost:5433/fianzas_test'
    }
  }
})

beforeAll(async () => {
  // Conectar a la base de datos
  await prisma.$connect()
})

beforeEach(async () => {
  // Limpiar todos los datos antes de cada prueba
  await cleanDatabase()
})

afterEach(async () => {
  // Limpiar todos los datos después de cada prueba
  await cleanDatabase()
})

// Función para limpiar la base de datos
async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `
  
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter(name => name !== '_prisma_migrations')
    .map(name => `"public"."${name}"`)
    .join(', ')

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  } catch (error) {
    console.log({ error })
  }
}

afterAll(async () => {
  // Limpiar y desconectar
  await prisma.user.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.income.deleteMany({})
  await prisma.expense.deleteMany({})
  await prisma.savingsGoal.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.$disconnect()
})

export { prisma }