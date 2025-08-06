# Product Requirements Document (PRD)
# Migración a TanStack React Query - Fianzas Manager Frontend

## 1. Resumen Ejecutivo

### 1.1 Propósito
Modernizar la capa de gestión de datos del frontend de Fianzas Manager mediante la migración de hooks personalizados a TanStack React Query, mejorando el rendimiento, la experiencia del usuario y la mantenibilidad del código.

### 1.2 Alcance
Migración completa de todos los servicios de datos y hooks de fetching del frontend, manteniendo compatibilidad hacia atrás durante el proceso de transición.

### 1.3 Objetivos Clave
- **Eficiencia**: Eliminar todo el código boilerplate en hooks de datos que se pueda`
- **Experiencia**: Implementar sincronización en tiempo real (refetch, invalidate queries)

## 2. Contexto y Problema

### 2.1 Estado Actual
El frontend actualmente utiliza un sistema de gestión de estado manual con las siguientes características:

#### Arquitectura Actual
- **Cliente HTTP**: Axios con interceptores personalizados
- **Servicios**: Clases singleton por feature (CategoryService, etc.)
- **Hooks**: Gestión manual de estado local (loading, error, data)
- **Sincronización**: Re-fetching manual después de mutaciones

#### Problemas Identificados
| Problema | Impacto | Frecuencia |
|----------|---------|------------|
| Duplicación de fetches | Alto consumo de ancho de banda | Diaria |
| Estados desincronizados | Datos inconsistentes en UI | Semanal |
| Código repetitivo | Velocidad de desarrollo reducida | Constante |
| Sin caché compartido | Performance degradada | Diaria |
| Actualizaciones optimistas frágiles | UX subóptima | Frecuente |

### 2.2 Métricas Actuales
- **Tiempo promedio de carga inicial**: 2.3 segundos
- **Re-fetches innecesarios por sesión**: ~47
- **Líneas de código en hooks de datos**: ~1,200
- **Bugs relacionados con sincronización**: 3-5 por sprint

## 3. Solución Propuesta

### 3.1 Visión General
Implementar TanStack React Query como capa de gestión de datos, proporcionando:
- Cache centralizado y compartido
- Invalidación inteligente de queries
- Sincronización automática en background
- Deduplicación de peticiones

### 3.2 Arquitectura Objetivo

```
┌─────────────────────────────────────────┐
│          Componentes React              │
├─────────────────────────────────────────┤
│     Hooks de React Query                │
│  (useQuery, useMutation, useInfinite)   │
├─────────────────────────────────────────┤
│         Query Client                    │
│    (Cache, Invalidación, Config)        │
├─────────────────────────────────────────┤
│      Adaptador de API                   │
│    (queryApi wrapper de apiClient)      │
├─────────────────────────────────────────┤
│     Cliente HTTP Existente              │
│         (Axios + Auth)                  │
└─────────────────────────────────────────┘
```

### 3.3 Características Principales

#### 3.3.1 Sistema de Cache Inteligente
- **Stale Time**: 1 minutos por defecto
- **Cache Time**: 2 minutos
- **Window Focus Refetch**: Deshabilitado por defecto

#### 3.3.2 Query Keys Factory
Sistema centralizado de keys para queries con estructura jerárquica:
```typescript
queryKeys.categories.list({ type: 'INCOME', page: 1 })
queryKeys.incomes.detail('income-id-123')
```

#### 3.3.3 Paginación Infinita
- Scroll infinito para listas largas
- Prefetching de siguiente página
- Cache por página individual

## 4. Requerimientos Funcionales

### 4.1 Módulo de Categorías

#### RF-CAT-001: Query de Categorías
**Como** usuario
**Quiero** ver mis categorías actualizadas
**Para** gestionar mis finanzas correctamente

**Criterios de Aceptación:**
- Las categorías se cargan desde cache si están disponibles
- Cache se invalida automáticamente tras mutaciones
- Soporte para filtros (tipo, búsqueda, paginación)

#### RF-CAT-002: Mutaciones de Categorías
**Como** usuario
**Quiero** crear/editar/eliminar categorías con invalidate queries
**Para** no refrescar manualmente la pagina

**Criterios de Aceptación:**
- Los datos se ven actualizados en pantalla gracias a invalidate queries y el refetch
- Mensajes de error claros

### 4.2 Módulo de Ingresos

#### RF-INC-001: Lista de Ingresos Paginada
**Como** usuario
**Quiero** navegar mis ingresos eficientemente
**Para** revisar mi historial financiero

**Criterios de Aceptación:**
- Paginación con cache por página
- Prefetch de página siguiente
- Invalidación selectiva por página

#### RF-INC-002: Creación de Ingresos
**Como** usuario
**Quiero** registrar ingresos rápidamente
**Para** mantener mis finanzas al día

**Criterios de Aceptación:**
- Feedback inmediato en UI
- Invalidación de queries relacionadas
- Persistencia garantizada

### 4.3 Módulo de Gastos

#### RF-EXP-001: Dashboard de Gastos
**Como** usuario
**Quiero** ver resúmenes actualizados de gastos
**Para** controlar mi presupuesto

**Criterios de Aceptación:**
- Queries paralelas para diferentes métricas
- Cache compartido entre vistas
- Actualización en tiempo real

### 4.4 Sincronización Global

#### RF-SYNC-001: Invalidación Cascada
**Como** sistema
**Quiero** mantener datos consistentes
**Para** evitar información desactualizada

**Criterios de Aceptación:**
- Invalidación automática de queries relacionadas
- Refetch inteligente basado en dependencias
- Sin re-renders innecesarios

## 5. Requerimientos No Funcionales

### 5.1 Rendimiento
- **RNF-001**: Tiempo de respuesta percibido < 100ms para acciones con cache
- **RNF-002**: Reducción de 40% en peticiones HTTP duplicadas
- **RNF-003**: Bundle size incremento máximo de 15KB

### 5.2 Mantenibilidad
- **RNF-007**: Reducción de 40% en líneas de código de hooks
- **RNF-008**: Testing coverage mínimo 80%
- **RNF-009**: Documentación inline completa

### 5.3 Usabilidad
- **RNF-010**: DevTools para debugging en desarrollo
- **RNF-011**: Indicadores de loading consistentes
- **RNF-012**: Mensajes de error user-friendly

## 6. Requerimientos Técnicos

### 6.1 Dependencias
```json
{
  "@tanstack/react-query": "^5.x",
  "@tanstack/react-query-devtools": "^5.x"
}
```

### 6.2 Compatibilidad
- React 19.1+
- TypeScript 5.8+
- Mantener compatibilidad con backend actual

### 6.3 Configuración Base
```typescript
QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

## 7. Plan de Implementación

### 7.1 Fases del Proyecto

#### Fase 1: Preparación (Sprint 1)
- **Semana 1-2**
  - [ ] Instalación de dependencias
  - [ ] Configuración de QueryClient
  - [ ] Setup de Provider y DevTools
  - [ ] Sistema de Query Keys

#### Fase 2: Adaptadores (Sprint 1)
- **Semana 2**
  - [ ] Wrapper queryApi para apiClient
  - [ ] Tipos TypeScript para React Query
  - [ ] Utilidades de testing

#### Fase 3: Migración Core (Sprint 2-3)
- **Semana 3-4**: Módulo Categorías
  - [ ] useCategoriesQuery
  - [ ] Mutations (create, update, delete)
  - [ ] Tests unitarios

- **Semana 5-6**: Módulo Ingresos
  - [ ] useIncomesQuery con paginación
  - [ ] useInfiniteIncomes
  - [ ] Mutations

#### Fase 4: Migración Completa (Sprint 3-4)
- **Semana 7-8**: Módulos restantes
  - [ ] Gastos
  - [ ] Inversiones
  - [ ] Metas de ahorro
  - [ ] Reportes

#### Fase 5: Optimización (Sprint 4-5)
- **Semana 9-10**
  - [ ] Prefetching estratégico
  - [ ] Background sync
  - [ ] Performance tuning
  - [ ] Documentación final

### 7.2 Estrategia de Rollout
1. **Feature Flags**: Activación full



## 8. Criterios de Éxito

### 8.1 KPIs Técnicos
| Métrica | Baseline | Target | Método de Medición |
|---------|----------|--------|-------------------|
| Tiempo de carga inicial | 2.3s | 1.4s | Performance API |
| Re-fetches por sesión | 47 | 15 | Analytics |
| Líneas de código (hooks) | 1,200 | 720 | Code analysis |
| Bundle size | 450KB | <465KB | Webpack analyzer |

### 8.2 KPIs de Negocio

### 8.3 Criterios de Aceptación
- [ ] Todos los tests existentes pasan
- [ ] Coverage de tests > 80%
- [ ] Sin regresiones funcionales
- [ ] Documentación completa



## 10. Consideraciones de Seguridad

### 10.1 Gestión de Datos Sensibles
- No almacenar datos sensibles en cache
- Limpieza de cache en logout
- Sanitización de datos antes de cache

### 10.2 Autenticación
- Mantener sistema actual de JWT
- Invalidación de queries en cambio de usuario
- Retry con refresh token automático

## 11. Testing Strategy

### 11.1 Tipos de Tests
- **Unit Tests**: Hooks individuales con mock de QueryClient
- **Integration Tests**: Flujos completos con MSW
- **E2E Tests**: Scenarios críticos con Puppeteer

### 11.2 Coverage Targets
- Hooks de queries: 90%
- Mutations: 85%
- Utilidades: 95%
- Overall: 80%

## 12. Documentación

### 12.1 Documentación Técnica
- [ ] Guía de migración para desarrolladores
- [ ] Patrones y mejores prácticas
- [ ] Troubleshooting guide
- [ ] API reference

### 12.2 Documentación de Usuario
- [ ] Changelog de cambios visibles
- [ ] Mejoras de performance comunicadas
- [ ] Nuevas funcionalidades

## 13. Mantenimiento Post-Launch

### 13.1 Monitoreo
- Dashboard de métricas de React Query
- Alertas de cache hit ratio
- Performance monitoring

### 13.2 Optimización Continua
- Review mensual de configuración de cache
- Análisis de query patterns
- Identificación de oportunidades de prefetch

## 14. Presupuesto y Recursos

### 14.1 Equipo Requerido
- 2 Frontend Developers Senior
- 1 QA Engineer
- 0.5 DevOps (configuración CI/CD)


**Versión**: 1.0.0
**Fecha**: Enero 2025
**Estado**: DRAFT
**Próxima Revisión**: Por definir

---

## Anexos

### A. Ejemplo de Código - Hook Migrado

```typescript
// ANTES - Hook manual
export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await categoryService.fetchCategories()
      setCategories(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return { categories, loading, error, refetch: fetchCategories }
}

// DESPUÉS - Con React Query
export const useCategories = (options?: CategoryOptions) => {
  return useQuery({
    queryKey: queryKeys.categories.list(options),
    queryFn: () => categoryService.fetchCategories(options),
    select: (data) => data.data?.categories || [],
  })
}
```

### B. Métricas de Performance Esperadas

```
Operación               | Actual  | Con React Query | Mejora
------------------------|---------|-----------------|--------
Primera carga           | 2300ms  | 2300ms         | 0%
Segunda carga (cached)  | 1800ms  | 50ms           | 97%
Update optimista        | 500ms   | 0ms            | 100%
Refetch después de mut. | 1200ms  | 600ms          | 50%
```

### C. Query Keys Structure

```typescript
const queryKeys = {
  all: ['api'],
  categories: {
    all: ['api', 'categories'],
    lists: () => ['api', 'categories', 'list'],
    list: (filters) => ['api', 'categories', 'list', filters],
    detail: (id) => ['api', 'categories', 'detail', id],
  },
  incomes: {
    all: ['api', 'incomes'],
    lists: () => ['api', 'incomes', 'list'],
    list: (page, limit) => ['api', 'incomes', 'list', { page, limit }],
    detail: (id) => ['api', 'incomes', 'detail', id],
  },
}
```
