import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Crear usuario de prueba
  const hashedPassword = await bcrypt.hash('test123', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@fianzas.com' },
    update: {},
    create: {
      email: 'test@fianzas.com',
      name: 'Usuario de Prueba',
      password: hashedPassword,
    },
  })

  console.log('👤 Test user created:', testUser.email)

  // Crear categorías por defecto de ingresos
  const incomeCategories = [
    { name: 'Sueldo', type: 'INCOME', color: '#10b981' },
    { name: 'Salario Base', type: 'INCOME', color: '#059669' },
    { name: 'Aguinaldo', type: 'INCOME', color: '#34d399' },
    { name: 'Prima Vacacional', type: 'INCOME', color: '#6ee7b7' },
    { name: 'Bonos y Comisiones', type: 'INCOME', color: '#3b82f6' },
    { name: 'Trabajo Extra', type: 'INCOME', color: '#60a5fa' },
    { name: 'Freelance', type: 'INCOME', color: '#93c5fd' },
    { name: 'Negocio Propio', type: 'INCOME', color: '#8b5cf6' },
    { name: 'Inversiones', type: 'INCOME', color: '#a78bfa' },
    { name: 'Dividendos', type: 'INCOME', color: '#c4b5fd' },
    { name: 'Alquileres', type: 'INCOME', color: '#f59e0b' },
    { name: 'Pensión', type: 'INCOME', color: '#fbbf24' },
    { name: 'Jubilación', type: 'INCOME', color: '#fcd34d' },
    { name: 'Apoyo Familiar', type: 'INCOME', color: '#ef4444' },
    { name: 'Prestamos Recibidos', type: 'INCOME', color: '#f87171' },
    { name: 'Ventas', type: 'INCOME', color: '#06b6d4' },
    { name: 'Reembolsos', type: 'INCOME', color: '#67e8f9' },
    { name: 'Otros Ingresos', type: 'INCOME', color: '#84cc16' }
  ]

  // Crear categorías por defecto de gastos
  const expenseCategories = [
    { name: 'Vivienda', type: 'EXPENSE', color: '#ef4444' },
    { name: 'Renta/Hipoteca', type: 'EXPENSE', color: '#dc2626' },
    { name: 'Predial', type: 'EXPENSE', color: '#f87171' },
    { name: 'Mantenimiento Hogar', type: 'EXPENSE', color: '#fca5a5' },
    { name: 'Alimentación', type: 'EXPENSE', color: '#f97316' },
    { name: 'Supermercado', type: 'EXPENSE', color: '#fb923c' },
    { name: 'Restaurantes', type: 'EXPENSE', color: '#fdba74' },
    { name: 'Transporte', type: 'EXPENSE', color: '#eab308' },
    { name: 'Gasolina', type: 'EXPENSE', color: '#facc15' },
    { name: 'Transporte Público', type: 'EXPENSE', color: '#fde047' },
    { name: 'Uber/Taxi', type: 'EXPENSE', color: '#fef08a' },
    { name: 'Servicios', type: 'EXPENSE', color: '#22c55e' },
    { name: 'Luz', type: 'EXPENSE', color: '#4ade80' },
    { name: 'Agua', type: 'EXPENSE', color: '#86efac' },
    { name: 'Gas', type: 'EXPENSE', color: '#bbf7d0' },
    { name: 'Internet', type: 'EXPENSE', color: '#06b6d4' },
    { name: 'Teléfono', type: 'EXPENSE', color: '#22d3ee' },
    { name: 'Cable/Streaming', type: 'EXPENSE', color: '#67e8f9' },
    { name: 'Salud', type: 'EXPENSE', color: '#3b82f6' },
    { name: 'Médicos', type: 'EXPENSE', color: '#60a5fa' },
    { name: 'Medicinas', type: 'EXPENSE', color: '#93c5fd' },
    { name: 'Dentista', type: 'EXPENSE', color: '#dbeafe' },
    { name: 'Educación', type: 'EXPENSE', color: '#8b5cf6' },
    { name: 'Colegiaturas', type: 'EXPENSE', color: '#a78bfa' },
    { name: 'Libros', type: 'EXPENSE', color: '#c4b5fd' },
    { name: 'Cursos', type: 'EXPENSE', color: '#e9d5ff' },
    { name: 'Entretenimiento', type: 'EXPENSE', color: '#ec4899' },
    { name: 'Cine', type: 'EXPENSE', color: '#f472b6' },
    { name: 'Conciertos', type: 'EXPENSE', color: '#f9a8d4' },
    { name: 'Deportes', type: 'EXPENSE', color: '#fbcfe8' },
    { name: 'Deudas', type: 'EXPENSE', color: '#dc2626' },
    { name: 'Tarjetas de Crédito', type: 'EXPENSE', color: '#b91c1c' },
    { name: 'Préstamos', type: 'EXPENSE', color: '#991b1b' },
    { name: 'Seguros', type: 'EXPENSE', color: '#6b7280' },
    { name: 'Seguro Auto', type: 'EXPENSE', color: '#9ca3af' },
    { name: 'Seguro Vida', type: 'EXPENSE', color: '#d1d5db' },
    { name: 'Seguro Gastos Médicos', type: 'EXPENSE', color: '#e5e7eb' },
    { name: 'Ropa y Calzado', type: 'EXPENSE', color: '#f59e0b' },
    { name: 'Cuidado Personal', type: 'EXPENSE', color: '#fbbf24' },
    { name: 'Peluquería', type: 'EXPENSE', color: '#fcd34d' },
    { name: 'Regalos', type: 'EXPENSE', color: '#84cc16' },
    { name: 'Donaciones', type: 'EXPENSE', color: '#a3e635' },
    { name: 'Impuestos', type: 'EXPENSE', color: '#7c3aed' },
    { name: 'Multas', type: 'EXPENSE', color: '#a855f7' },
    { name: 'Otros Gastos', type: 'EXPENSE', color: '#64748b' }
  ]

  // Crear todas las categorías
  const allCategories = [...incomeCategories, ...expenseCategories]
  
  for (const categoryData of allCategories) {
    await prisma.category.upsert({
      where: { 
        id: `${categoryData.name}-${categoryData.type}`.toLowerCase().replace(/[^a-z0-9]/g, '-')
      },
      update: {},
      create: {
        id: `${categoryData.name}-${categoryData.type}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ...categoryData,
        type: categoryData.type as any
      },
    })
  }

  console.log(`📋 Created ${allCategories.length} default categories`)

  // Crear cuenta por defecto
  const defaultAccount = await prisma.account.upsert({
    where: { 
      id: `default-account-${testUser.id}`
    },
    update: {},
    create: {
      id: `default-account-${testUser.id}`,
      name: 'Cuenta Principal',
      type: 'CHECKING',
      balance: 0,
      currency: 'MXN',
      userId: testUser.id,
    },
  })

  console.log('💳 Default account created:', defaultAccount.name)
  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })