# Product Requirements Document (PRD)
## Filtros y Búsqueda de Egresos - MVP

**Versión**: 1.0.0
**Fecha**: Enero 2025
**Estado**: Propuesto
**Tipo**: MVP (Minimum Viable Product)

---

## 📋 Resumen Ejecutivo

Este documento define los requisitos para implementar funcionalidades de filtrado y búsqueda en la sección de gestión de egresos de Fianzas Manager. El objetivo es mejorar la experiencia del usuario permitiendo encontrar rápidamente gastos específicos mediante filtros de fecha y búsqueda por texto.

---

## 🎯 Objetivos

### Objetivo Principal
Permitir a los usuarios localizar rápidamente egresos específicos mediante herramientas de filtrado y búsqueda.

### Objetivos Específicos
1. Implementar filtros por rango de fechas (creación y vencimiento)
2. Agregar búsqueda por descripción del egreso
3. Mantener la paginación existente con los filtros aplicados
4. Proporcionar una experiencia de usuario fluida y responsiva

---

## 👤 Usuarios Objetivo

- **Usuario Principal**: Personas que gestionan sus finanzas personales con múltiples gastos mensuales
- **Necesidad**: Encontrar rápidamente gastos específicos entre decenas o cientos de registros
- **Contexto de Uso**: Revisión mensual de gastos, búsqueda de pagos específicos, análisis de gastos por período

---

## 📝 Requisitos Funcionales

### RF-01: Filtro por Fecha de Creación

**Descripción**: El usuario podrá filtrar egresos por rango de fecha de creación.

**Criterios de Aceptación**:
- Selector de fecha inicial (desde) por defecto la fecha inicial es el primer dia del mes actual
- Selector de fecha final (hasta)
- Ambas fechas son opcionales
- Si solo se especifica "desde", muestra todos los egresos desde esa fecha
- Si solo se especifica "hasta", muestra todos los egresos hasta esa fecha
- El filtro se aplica al hacer clic en "Aplicar Filtros" o automáticamente al cambiar las fechas

**Comportamiento**:
```
- Fecha desde: 01/01/2025
- Fecha hasta: 31/01/2025
- Resultado: Todos los egresos creados entre estas fechas
```

### RF-02: Filtro por Fecha de Vencimiento

**Descripción**: El usuario podrá filtrar egresos por rango de fecha de vencimiento.

**Criterios de Aceptación**:
- Selector de fecha inicial de vencimiento (desde)
- Selector de fecha final de vencimiento (hasta)
- Ambas fechas son opcionales
- Incluye egresos sin fecha de vencimiento como opción filtrable
- Compatible con el filtro de fecha de creación (filtros acumulativos)

**Comportamiento**:
```
- Vencimiento desde: 15/01/2025
- Vencimiento hasta: 15/02/2025
- Resultado: Todos los egresos que vencen en ese período
```

### RF-03: Búsqueda por Descripción

**Descripción**: Campo de búsqueda que permite buscar egresos por su descripción.

**Criterios de Aceptación**:
- Campo de texto con placeholder "Buscar por descripción..."
- Búsqueda no sensible a mayúsculas/minúsculas
- Búsqueda parcial (contiene el texto)
- Búsqueda en tiempo real con debounce de 500ms
- Mínimo 2 caracteres para iniciar búsqueda
- La búsqueda se realiza mediante el endpoint del backend

**Comportamiento**:
```
- Búsqueda: "alquiler"
- Resultado: Todos los egresos que contengan "alquiler" en su descripción
  - "Alquiler de vivienda" ✓
  - "Pago de alquiler mensual" ✓
  - "ALQUILER" ✓
```

### RF-04: Combinación de Filtros

**Descripción**: Todos los filtros deben poder combinarse.

**Criterios de Aceptación**:
- Los filtros son acumulativos (AND lógico)
- Mostrar contador de filtros activos
- Botón "Limpiar Filtros" para resetear todos (al presionar limpiar filtros, la fecha inicial vuelve al primer dia del mes actual)
- Los filtros persisten durante la sesión
- Los filtros se mantienen al paginar

**Ejemplo de Combinación**:
```
- Búsqueda: "servicio"
- Creado desde: 01/01/2025
- Vence hasta: 28/02/2025
- Resultado: Egresos que contengan "servicio", creados desde el 01/01 y que venzan antes del 28/02
```

### RF-05: Indicadores Visuales

**Descripción**: Feedback visual del estado de filtros y búsqueda.

**Criterios de Aceptación**:
- Indicador de carga durante la búsqueda
- Mensaje cuando no hay resultados
- Badge con cantidad de filtros activos
- Highlight del texto buscado en los resultados (opcional para MVP)

---

## 🔧 Requisitos Técnicos

### Backend (API)

#### Endpoint Modificado: `GET /api/expenses`

**Parámetros de Query Existentes**:
- `page`: número de página
- `limit`: cantidad por página
- `category`: filtro por categoría
- `frequency`: filtro por frecuencia
- `status`: filtro por estado
- `sort`: campo de ordenamiento
- `order`: dirección (asc/desc)

**Nuevos Parámetros de Query**:
- `search`: string - búsqueda por descripción
- `createdFrom`: ISO date string - fecha de creación desde
- `createdTo`: ISO date string - fecha de creación hasta
- `dueFrom`: ISO date string - fecha de vencimiento desde
- `dueTo`: ISO date string - fecha de vencimiento hasta

**Ejemplo de Request**:
```http
GET /api/expenses?page=1&limit=10&search=alquiler&createdFrom=2025-01-01T00:00:00Z&dueTo=2025-02-28T23:59:59Z
```

**Validaciones Backend**:
- `search`: mínimo 2 caracteres, máximo 100
- Fechas en formato ISO 8601
- `createdFrom` debe ser menor o igual a `createdTo`
- `dueFrom` debe ser menor o igual a `dueTo`

### Frontend (React)

#### Componente: ExpenseFilters

**Ubicación**: `frontend/src/features/expenses/components/ExpenseFilters.component.tsx`

**Props**:
```typescript
interface ExpenseFiltersProps {
  onFiltersChange: (filters: ExpenseFilterParams) => void;
  loading?: boolean;
  className?: string;
}

interface ExpenseFilterParams {
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  dueFrom?: string;
  dueTo?: string;
}
```

#### Hook Modificado: useExpenses

**Cambios en `useExpenses.hook.ts`**:
```typescript
interface UseExpensesParams {
  page?: number;
  limit?: number;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  dueFrom?: string;
  dueTo?: string;
  // ... otros parámetros existentes
}
```

#### Integración con ExpenseList

El componente `ExpenseList` deberá:
1. Importar y renderizar `ExpenseFilters`
2. Mantener el estado de filtros activos
3. Pasar filtros al hook `useExpenses`
4. Mostrar indicadores de filtros activos

---

## 🎨 Diseño de Interfaz (MVP)

### Layout de Filtros

```
┌─────────────────────────────────────────────────────────┐
│  Gestión de Egresos                                    │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ 🔍 Buscar por descripción...                  │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  Fecha de Creación        Fecha de Vencimiento         │
│  ┌──────────┐ ┌──────────┐  ┌──────────┐ ┌──────────┐│
│  │ Desde    │ │ Hasta    │  │ Desde    │ │ Hasta    ││
│  └──────────┘ └──────────┘  └──────────┘ └──────────┘│
│                                                         │
│  [Aplicar Filtros] [Limpiar] (2 filtros activos)      │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  [Lista de Egresos]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Estados de la Interfaz

1. **Estado Inicial**: Todos los campos vacíos, sin filtros aplicados
2. **Buscando**: Spinner en el campo de búsqueda, lista con opacity reducida
3. **Con Filtros**: Badge mostrando cantidad de filtros, botón "Limpiar" visible
4. **Sin Resultados**: Mensaje "No se encontraron egresos con los filtros aplicados"

---

## 📊 Criterios de Éxito

### Métricas de Implementación
- ✅ Los filtros funcionan correctamente de manera individual
- ✅ Los filtros se pueden combinar sin errores
- ✅ La búsqueda responde en menos de 1 segundo
- ✅ La paginación funciona con filtros aplicados
- ✅ No hay regresiones en funcionalidad existente

### Métricas de Usuario (Post-MVP)
- Reducción del tiempo para encontrar un egreso específico
- Aumento en el uso de la función de búsqueda
- Feedback positivo de usuarios sobre la facilidad de uso

---

## 🚀 Plan de Implementación

### Fase 1: Backend (2-3 horas)
1. Modificar `ExpenseController` para aceptar nuevos parámetros
2. Actualizar `ExpenseService` con lógica de filtrado
3. Agregar validaciones con Zod
4. Escribir tests unitarios

### Fase 2: Frontend - Componentes (3-4 horas)
1. Crear componente `ExpenseFilters`
2. Modificar hook `useExpenses`
3. Integrar con `ExpenseList`
4. Implementar debounce para búsqueda

### Fase 3: Integración y Testing (2 horas)
1. Testing de integración frontend-backend
2. Pruebas de rendimiento con datasets grandes
3. Ajustes de UX basados en pruebas

### Tiempo Total Estimado: 7-9 horas

---

## ⚠️ Consideraciones y Limitaciones

### Limitaciones del MVP
1. Sin búsqueda en otros campos (categoría, monto)
2. Sin guardado de filtros favoritos
3. Sin exportación de resultados filtrados
4. Sin búsqueda fuzzy o por similitud

### Consideraciones de Rendimiento
1. Implementar índices en base de datos para campos de búsqueda
2. Limitar resultados máximos por página
3. Considerar caché de búsquedas frecuentes (post-MVP)

### Consideraciones de UX
1. Debounce en búsqueda para evitar requests excesivos
2. Mensajes claros cuando no hay resultados
3. Preservar filtros al navegar entre páginas

---

## 🔄 Mejoras Futuras (Post-MVP)

1. **Filtros Avanzados**:
   - Por rango de montos
   - Por múltiples categorías
   - Por múltiples estados

2. **Búsqueda Mejorada**:
   - Búsqueda en múltiples campos
   - Búsqueda con operadores (AND, OR, NOT)
   - Sugerencias de búsqueda

3. **Guardado de Filtros**:
   - Guardar combinaciones de filtros frecuentes
   - Filtros rápidos predefinidos

4. **Exportación**:
   - Exportar resultados filtrados a CSV/Excel
   - Generar reportes de resultados

5. **Visualización**:
   - Vista de calendario para vencimientos
   - Gráficos de gastos filtrados

---

## 📝 Notas de Implementación

### Validación de Fechas
- Usar la misma lógica GMT-3 existente en el sistema
- Validar que el rango de fechas sea coherente
- Considerar timezone del usuario

### Manejo de Errores
- Mostrar mensajes específicos para cada tipo de error
- Implementar retry automático en errores de red
- Log de errores para debugging

### Accesibilidad
- Todos los controles deben ser navegables por teclado
- Labels apropiados para screen readers
- Mensajes de estado anunciados a screen readers

---

## ✅ Checklist de Implementación

- [ ] Backend: Modificar ExpenseController
- [ ] Backend: Actualizar ExpenseService
- [ ] Backend: Agregar validaciones
- [ ] Backend: Tests unitarios
- [ ] Frontend: Crear ExpenseFilters component
- [ ] Frontend: Modificar useExpenses hook
- [ ] Frontend: Integrar con ExpenseList
- [ ] Frontend: Implementar debounce
- [ ] Frontend: Agregar indicadores visuales
- [ ] Testing: Integración end-to-end
- [ ] Testing: Pruebas de rendimiento
- [ ] Documentación: Actualizar API docs
- [ ] Deploy: Validar en ambiente de staging

---

**Documento creado para**: Fianzas Manager
**Autor**: Development Team
**Última actualización**: Enero 2025
