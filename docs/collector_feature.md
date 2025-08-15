# Plan de Implementación: Feature Collectors

## 📋 Descripción General

Sistema de gestión de collectors (receptores de pagos) que permite identificar y categorizar a quién se realizan los pagos en MercadoPago. Cada collector tiene un ID único de MercadoPago y un nombre personalizable por el usuario.

### Objetivos
- Crear tabla `collectors` con relación a `expenses`
- Implementar CRUD completo en backend
- Integrar con sincronización de MercadoPago
- Crear interfaz de administración en frontend
- Permitir filtrado de gastos por collector

---

## 🔵 ETAPA 1: BACKEND

### Paso 1: Actualizar Schema de Prisma

**Archivo:** `backend/prisma/schema.prisma`

**Acciones:**
1. Agregar modelo `Collector` después del modelo `Category`
2. Agregar campo `collectorId` al modelo `Expense`
3. Establecer relaciones bidireccionales

**Código a agregar:**
```prisma
// Modelo de Collectors (Receptores de pagos de MercadoPago)
model Collector {
  id           String   @id @default(cuid())
  collectorId  String   @unique  // ID único de MercadoPago
  name         String              // Nombre personalizable
  userId       String              // Usuario propietario
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relaciones
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expenses Expense[]
  
  @@index([userId])
  @@index([collectorId])
  @@map("collectors")
}
```

**Modificar en modelo Expense:**
```prisma
model Expense {
  // ... campos existentes ...
  collectorId           String?       // Nueva columna opcional
  
  // Relaciones (agregar)
  collector Collector? @relation(fields: [collectorId], references: [id])
}
```

### Paso 2: Ejecutar Migración

**Comandos:**
```bash
cd backend
npm run db:generate          # Generar cliente Prisma
npm run db:migrate            # Crear migración
# Nombre sugerido: add_collectors_table
```

### Paso 3: Crear Tipos TypeScript

**Archivo:** `backend/src/types/collector.types.ts` (CREAR)

**Contenido:**
```typescript
import { Prisma } from '@prisma/client'

export type CollectorWhereClause = Prisma.CollectorWhereInput
export type CollectorOrderBy = Prisma.CollectorOrderByWithRelationInput

export interface CollectorCreateData {
  collectorId: string
  name: string
}

export interface CollectorUpdateData {
  name?: string
}

```

**Archivo:** `backend/src/types/index.ts` (ACTUALIZAR)

Agregar:
```typescript
export * from './collector.types'
```

### Paso 4: Crear Servicio Collector

**Archivo:** `backend/src/services/collector.service.ts` (CREAR)

**Estructura del servicio:**
```typescript
import { prisma } from './database.service'
import { Collector, Prisma } from '@prisma/client'
import { z } from 'zod'

// Schemas de validación
const CollectorCreateSchema = z.object({
  collectorId: z.string().min(1),
  name: z.string().min(1).max(100),
})

const CollectorUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

export class CollectorService {
  // Crear collector
  async create(userId: string, data: z.infer<typeof CollectorCreateSchema>): Promise<Collector>
  
  // Buscar todos los collectors del usuario
  async findMany(userId: string, options?: {...}): Promise<Collector[]>
  
  // Buscar por ID
  async findById(userId: string, id: string): Promise<Collector | null>
  
  // Buscar por collectorId de MercadoPago
  async findByCollectorId(userId: string, collectorId: string): Promise<Collector | null>
  
  // Actualizar
  async update(userId: string, id: string, data: z.infer<typeof CollectorUpdateSchema>): Promise<Collector>
  
  // Eliminar (verificar que no tenga expenses)
  async delete(userId: string, id: string): Promise<Collector>
  
  // Obtener o crear (para sincronización)
  async getOrCreate(userId: string, collectorId: string, name?: string): Promise<Collector>
  
  // Contar expenses asociados
  async countExpenses(userId: string, id: string): Promise<number>
}

export const collectorService = new CollectorService()
```

### Paso 5: Crear Controlador Collector

**Archivo:** `backend/src/controllers/collector.controller.ts` (CREAR)

**Endpoints a implementar:**
```typescript
export const CollectorController = {
  // GET /api/collectors
  getAll: asyncHandler(async (req, res) => {...})
  
  // GET /api/collectors/:id
  getById: asyncHandler(async (req, res) => {...})
  
  // POST /api/collectors
  create: asyncHandler(async (req, res) => {...})
  
  // PUT /api/collectors/:id
  update: asyncHandler(async (req, res) => {...})
  
  // DELETE /api/collectors/:id
  delete: asyncHandler(async (req, res) => {...})
}
```

### Paso 6: Crear Rutas

**Archivo:** `backend/src/routes/collector.routes.ts` (CREAR)

```typescript
import { Router } from 'express'
import { CollectorController } from '../controllers'
import { authMiddleware } from '../middleware'

const router = Router()

router.use(authMiddleware)

router.get('/', CollectorController.getAll)
router.get('/:id', CollectorController.getById)
router.post('/', CollectorController.create)
router.put('/:id', CollectorController.update)
router.delete('/:id', CollectorController.delete)

export default router
```

### Paso 7: Registrar Rutas y Exportaciones

**Archivo:** `backend/src/routes/index.ts` (ACTUALIZAR)

Agregar:
```typescript
import collectorRoutes from './collector.routes'
// ...
router.use('/collectors', collectorRoutes)
```

**Archivo:** `backend/src/services/index.ts` (ACTUALIZAR)

Agregar:
```typescript
export { collectorService } from './collector.service'
```

**Archivo:** `backend/src/controllers/index.ts` (ACTUALIZAR)

Agregar:
```typescript
export { CollectorController } from './collector.controller'
```

### Paso 8: Actualizar MercadoPago Service

**Archivo:** `backend/src/services/mercadopago.service.ts` (ACTUALIZAR)

**Modificar método `convertPaymentToExpense`:**
```typescript
convertPaymentToExpense(
  payment: MercadoPagoPayment,
  userId: string,
  defaultCategoryId: string,
  collectorId?: string  // Nuevo parámetro opcional
) {
  // ... código existente ...
  
  return {
    description,
    amount,
    categoryId: defaultCategoryId,
    frequency: "ONE_TIME" as const,
    dueDate: formattedDueDate,
    status: "PAID" as const,
    mercadoPagoPaymentId: payment.id.toString(),
    collectorId: collectorId || undefined,  // Agregar collector
  }
}
```

**Modificar método `getRecentExpensePayments`:**
```typescript
async getRecentExpensePayments(
  userId: string,
  defaultCategoryId: string,
  dateFrom?: Date,
) {
  // ... código existente ...
  
  // Importar servicio de collectors
  const { collectorService } = await import('../services')
  
  // Convertir a expense format con collectors
  const expenses = await Promise.all(
    expensePayments.map(async (payment) => {
      let collectorId: string | undefined
      
      // Si el pago tiene collector, buscar o crear
      if (payment.collector?.id) {
        const collector = await collectorService.getOrCreate(
          userId,
          payment.collector.id.toString(),
          `Collector ${payment.collector.id}`
        )
        collectorId = collector.id
      }
      
      return this.convertPaymentToExpense(
        payment, 
        userId, 
        defaultCategoryId,
        collectorId
      )
    })
  )
  
  // ... resto del código ...
}
```

### Paso 9: Actualizar Expense Service

**Archivo:** `backend/src/services/expense.service.ts` (ACTUALIZAR)

**Modificar schema de validación:**
```typescript
const ExpenseCreateSchema = z.object({
  // ... campos existentes ...
  collectorId: z.string().optional(),
})
```

**Modificar método `findMany` para incluir collector:**
```typescript
async findMany(userId: string, options?: {
  // ... parámetros existentes ...
}): Promise<...> {
  return prisma.expense.findMany({
    // ... configuración existente ...
    include: {
      category: true,
      collector: true,  // Incluir collector
    },
  })
}
```

### Paso 10: Actualizar Expense Controller

**Archivo:** `backend/src/controllers/expense.controller.ts` (ACTUALIZAR)

**Agregar filtro por collector en `getAll`:**
```typescript
const ExpenseQuerySchema = z.object({
  // ... campos existentes ...
  collectorId: z.string().optional(),
})

// En método getAll:
if (collectorId) whereClause.collectorId = collectorId
```

### Paso 11: Testing Backend

**Pruebas a realizar:**
1. Crear migración exitosa
2. CRUD de collectors funcionando
3. Sincronización MercadoPago crea collectors
4. Expenses se relacionan correctamente con collectors
5. Validaciones funcionan (unicidad, eliminación)

---

## 🟢 ETAPA 2: FRONTEND

### Paso 12: Crear Estructura de Carpetas

**Crear estructura:**
```
frontend/src/features/collectors/
├── index.ts
├── components/
│   └── index.ts
├── hooks/
│   └── index.ts
├── services/
│   └── index.ts
└── types/
    └── index.ts
```

### Paso 13: Definir Tipos

**Archivo:** `frontend/src/features/collectors/types/collector.types.ts` (CREAR)

```typescript
export interface Collector {
  id: string
  collectorId: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    expenses: number
  }
}

export interface CollectorFormData {
  collectorId: string
  name: string
}
```

### Paso 14: Crear Servicio API

**Archivo:** `frontend/src/features/collectors/services/collector.service.ts` (CREAR)

```typescript
import { apiClient } from '@/shared/services/api'
import { Collector, CollectorFormData } from '../types'
import { ApiResponse } from '@/types'

class CollectorService {
  private readonly baseUrl = '/api/collectors'
  
  async getAll(): Promise<Collector[]>
  async getById(id: string): Promise<Collector>
  async create(data: CollectorFormData): Promise<Collector>
  async update(id: string, data: Partial<CollectorFormData>): Promise<Collector>
  async delete(id: string): Promise<void>
}

export const collectorService = new CollectorService()
```

### Paso 15: Crear Hook Principal

**Archivo:** `frontend/src/features/collectors/hooks/useCollectors.hook.ts` (CREAR)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectorService } from '../services'
import { CollectorFormData } from '../types'

export const useCollectors = () => {
  const queryClient = useQueryClient()
  
  // Query para obtener collectors
  const { data: collectors = [], isLoading, error } = useQuery({
    queryKey: ['collectors'],
    queryFn: () => collectorService.getAll(),
  })
  
  // Mutations...
  
  return {
    collectors,
    isLoading,
    error,
    createCollector,
    updateCollector,
    deleteCollector,
    refetch,
  }
}
```

### Paso 16: Crear Componente Lista

**Archivo:** `frontend/src/features/collectors/components/CollectorList.component.tsx` (CREAR)

```typescript
import React from 'react'
import { useCollectors } from '../hooks'
import { CollectorCard } from './CollectorCard.component'
import { CollectorForm } from './CollectorForm.component'

export const CollectorList: React.FC = () => {
  const { collectors, isLoading, deleteCollector } = useCollectors()
  const [showForm, setShowForm] = useState(false)
  const [editingCollector, setEditingCollector] = useState<Collector | null>(null)
  
  // Implementación del componente...
}
```

### Paso 17: Crear Componente Formulario

**Archivo:** `frontend/src/features/collectors/components/CollectorForm.component.tsx` (CREAR)

```typescript
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CollectorFormData } from '../types'

const collectorSchema = z.object({
  collectorId: z.string().min(1, 'ID de collector requerido'),
  name: z.string().min(1, 'Nombre requerido').max(100),
})

interface CollectorFormProps {
  onSubmit: (data: CollectorFormData) => void
  onCancel: () => void
  initialData?: Partial<CollectorFormData>
  isEditing?: boolean
}

export const CollectorForm: React.FC<CollectorFormProps> = ({...}) => {
  // Implementación con react-hook-form
}
```

### Paso 18: Crear Componente Card

**Archivo:** `frontend/src/features/collectors/components/CollectorCard.component.tsx` (CREAR)

```typescript
interface CollectorCardProps {
  collector: Collector
  onEdit: (collector: Collector) => void
  onDelete: (id: string) => void
}

export const CollectorCard: React.FC<CollectorCardProps> = ({...}) => {
  // Tarjeta con información del collector
  // Mostrar: nombre, ID, cantidad de gastos
  // Acciones: editar, eliminar
}
```

### Paso 19: Crear Diálogo de Confirmación

**Archivo:** `frontend/src/features/collectors/components/CollectorDeleteDialog.component.tsx` (CREAR)

```typescript
interface DeleteDialogProps {
  isOpen: boolean
  collectorName: string
  expenseCount: number
  onConfirm: () => void
  onCancel: () => void
}

export const CollectorDeleteDialog: React.FC<DeleteDialogProps> = ({...}) => {
  // Modal de confirmación
  // Advertir si hay gastos asociados
}
```

### Paso 20: Exportar Componentes

**Archivo:** `frontend/src/features/collectors/components/index.ts` (ACTUALIZAR)

```typescript
export { CollectorList } from './CollectorList.component'
export { CollectorForm } from './CollectorForm.component'
export { CollectorCard } from './CollectorCard.component'
export { CollectorDeleteDialog } from './CollectorDeleteDialog.component'
```

### Paso 21: Agregar Ruta en App

**Archivo:** `frontend/src/App.tsx` (ACTUALIZAR)

1. Importar componente:
```typescript
import { CollectorList } from './features/collectors'
```

2. Agregar ruta:
```typescript
<Route path="/collectors" element={<CollectorList />} />
```

### Paso 22: Agregar al Menú

**Archivo:** `frontend/src/shared/ui/layouts/MainLayout.component.tsx` (ACTUALIZAR)

Agregar item de menú:
```typescript
{
  label: 'Collectors',
  path: '/collectors',
  icon: UsersIcon,
}
```

### Paso 23: Actualizar ExpenseList

**Archivo:** `frontend/src/features/expenses/components/ExpenseList.component.tsx` (ACTUALIZAR)

1. Mostrar collector en la lista de gastos
2. Agregar filtro por collector
3. Opción para asignar collector a gastos existentes

### Paso 24: Testing Frontend

**Pruebas a realizar:**
1. CRUD de collectors funciona
2. Validaciones del formulario
3. Confirmación de eliminación
4. Integración con gastos
5. Filtros funcionan correctamente

---

## 📊 Verificación Final

### Checklist Backend
- [ ] Migración ejecutada exitosamente
- [ ] CRUD de collectors funcionando
- [ ] Integración con MercadoPago
- [ ] Relación con expenses correcta
- [ ] Validaciones funcionando
- [ ] Endpoints responden correctamente

### Checklist Frontend
- [ ] Lista de collectors se muestra
- [ ] Formulario crea/edita correctamente
- [ ] Eliminación con confirmación
- [ ] Integración en menú
- [ ] Filtros en expenses
- [ ] Manejo de errores

### Checklist Integración
- [ ] Sincronización MercadoPago crea collectors
- [ ] Gastos muestran collector correcto
- [ ] No hay errores en consola
- [ ] Performance aceptable

---

## 🚀 Comandos de Ejecución

### Backend
```bash
cd backend
npm run db:generate
npm run db:migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

### Testing
```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

---

## 📝 Notas Adicionales

- Los collectors se crean automáticamente durante la sincronización
- El usuario puede personalizar los nombres después
- No se pueden eliminar collectors con gastos asociados
- El collectorId de MercadoPago es único en el sistema
- Los gastos antiguos tendrán collectorId null (retrocompatibilidad)