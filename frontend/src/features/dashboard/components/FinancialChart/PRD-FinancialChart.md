# PRD - Componente FinancialChart
## Documento de Requisitos de Producto

**Versión:** 1.0  
**Fecha:** 03 de Agosto, 2025  
**Autor:** Análisis de Componente Existente  
**Proyecto:** Fianzas Manager - Sistema de Gestión Financiera Personal  

---

## 1. Resumen Ejecutivo

### 1.1 Propósito
El componente **FinancialChart** es el núcleo del análisis financiero avanzado en Fianzas Manager. Proporciona visualización inteligente del flujo de caja, análisis automático de tendencias financieras, y insights en tiempo real para usuarios que gestionan sus finanzas personales.

### 1.2 Valor de Negocio
- **Toma de decisiones informadas**: Visualización clara que facilita decisiones financieras estratégicas
- **Detección automática de problemas**: Identificación inmediata de déficits y oportunidades de superávit
- **Seguimiento temporal**: Análisis de tendencias financieras a través de diferentes períodos
- **Eficiencia operativa**: Reduce el tiempo necesario para analizar la situación financiera personal

### 1.3 Audiencia Objetivo
- Usuarios activos de gestión financiera personal
- Personas que requieren visualización de tendencias de ingresos/gastos
- Usuarios que necesitan análisis rápido de su situación financiera
- Planificadores de presupuestos y metas financieras

---

## 2. Especificaciones Funcionales

### 2.1 Funcionalidades Core

#### 2.1.1 Visualización de Datos Financieros
- **Gráfico Compuesto**: Combinación de barras (datos diarios) y líneas (datos acumulados)
- **Ingresos Diarios**: Barras verdes que muestran ingresos por día
- **Gastos Diarios**: Barras rojas que muestran gastos por día  
- **Gastos Acumulados**: Línea roja sólida que muestra la progresión acumulativa de gastos
- **Ingresos Acumulados**: Línea verde punteada que muestra la progresión acumulativa de ingresos
- **Línea de Equilibrio**: Referencia visual en Y=0 para identificar puntos de equilibrio

#### 2.1.2 Análisis Automático Inteligente
- **Estado Financiero**: Clasificación automática en Superávit, Déficit, o Equilibrado
- **Análisis Porcentual**: Cálculo automático de variaciones porcentuales
- **Indicadores Visuales**: Código de colores e iconos dinámicos basados en el estado financiero
  - Verde + ArrowTrendingUp: Superávit
  - Rojo + ArrowTrendingDown: Déficit  
  - Amarillo + CurrencyDollar: Equilibrado

#### 2.1.3 Selectores Temporales
- **Períodos Configurables**: Día, Semana, Mes, Año
- **Navegación Temporal**: Cambio dinámico de período con recálculo automático de datos
- **Fechas Inteligentes**: Configuración automática de rangos basada en el período seleccionado

### 2.2 Interacciones del Usuario

#### 2.2.1 Tooltip Interactivo
- **Activación**: Hover sobre cualquier punto del gráfico
- **Información Mostrada**:
  - Fecha formateada del punto seleccionado
  - Ingresos del día con formato de moneda
  - Gastos del día con formato de moneda
  - Gastos acumulados hasta la fecha
  - Balance acumulado hasta la fecha (total ingresos acumulados - total gastos acumulados)
- **Código de Colores**: Consistente con la paleta general del gráfico

#### 2.2.2 Métricas de Resumen
- **Total de Ingresos**: Suma total de ingresos del período
- **Total de Gastos**: Suma total de gastos del período  
- **Balance Final**: Diferencia neta con indicación visual del estado

---

## 3. Requisitos Técnicos

### 3.1 Dependencias y Tecnologías

#### 3.1.1 Dependencias Principales
- **React**: Hooks (useState, useCallback) para gestión de estado y rendimiento
- **Recharts**: Biblioteca de gráficos (ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine)
- **Heroicons**: Iconografía semántica (CalendarDaysIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartBarIcon, CurrencyDollarIcon)
- **date-fns**: Manipulación de fechas (startOfMonth, endOfMonth)
- **Tailwind CSS**: Framework de estilos

#### 3.1.2 Arquitectura del Componente
- **Hook Personalizado**: `useFinancialChartData` para lógica de procesamiento de datos
- **Separación de Responsabilidades**: Componente presentacional puro
- **Optimización de Rendimiento**: Memoización con `useCallback` para funciones críticas
- **Responsividad**: `ResponsiveContainer` para adaptabilidad automática

### 3.2 Estructuras de Datos

#### 3.2.1 Tipos de Entrada
```typescript
interface Income {
  description: string
  amount: number
  category: string
  frequency: string
  income_date: string
  userId: string
  id: string
  createdAt: string
  updatedAt: string
}

interface Expense {
  // Estructura similar a Income
  description: string
  amount: number
  category: string
  expense_date: string
  userId: string
  id: string
  createdAt: string
  updatedAt: string
}

interface ChartConfig {
  period: 'day' | 'week' | 'month' | 'year'
  startDate: Date
  endDate: Date
  showProjection: boolean
  showTrend: boolean
}
```

#### 3.2.2 Datos Procesados
```typescript
interface ChartDataPoint {
  date: string
  day: number
  income: number
  expenses: number
  cumulativeExpenses: number
  cumulativeIncome: number
  balance: number // Balance acumulativo: suma total de ingresos - suma total de gastos hasta la fecha
  projectedBalance: number
}

interface AnalysisResult {
  status: 'surplus' | 'deficit' | 'balanced'
  amount: number
  percentage: number
}

interface SummaryData {
  totalIncome: number
  totalExpenses: number
}
```

### 3.3 Requisitos de Rendimiento
- **Tiempo de Respuesta**: < 200ms para cambios de período
- **Memoización**: Tooltip y funciones de callback optimizadas
- **Procesamiento de Datos**: Eficiente manejo de datasets de hasta 31 días (período mensual)
- **Adaptabilidad**: Responsive sin cálculos manuales de dimensiones

---

## 4. Experiencia de Usuario

### 4.1 Flujos de Interacción

#### 4.1.1 Flujo Principal
1. Usuario accede al dashboard financiero
2. FinancialChart se carga con datos del mes actual por defecto
3. Usuario puede cambiar el período usando el selector temporal
4. Los datos se recalculan automáticamente
5. Usuario puede explorar detalles usando hover sobre el gráfico
6. Análisis financiero se actualiza en tiempo real

#### 4.1.2 Estados Visuales
- **Carga**: Indicadores de procesamiento durante recálculo de datos
- **Datos Vacíos**: Mensaje informativo cuando no hay datos para el período
- **Error**: Manejo graceful de errores de datos
- **Interacción**: Feedback visual inmediato en hover y selección

### 4.2 Principios de Diseño

#### 4.2.1 Código de Colores Semántico
- **Verde (#10b981)**: Ingresos, valores positivos, superávit
- **Rojo (#ef4444)**: Gastos, valores negativos, déficit
- **Azul (#3b82f6)**: Datos acumulados, información neutral
- **Amarillo**: Estados de equilibrio o advertencia
- **Gris**: Elementos de interfaz, ejes, líneas de referencia

#### 4.2.2 Accesibilidad
- Iconos semánticamente apropiados
- Contraste de colores WCAG compliant
- Tooltips informativos para screen readers
- Estructura HTML semántica
- Navegación por teclado funcional

---

## 5. Casos de Uso Detallados

### 5.1 Casos de Uso Principales

#### 5.1.1 Seguimiento de Flujo de Caja Mensual
**Actor**: Usuario de gestión financiera personal  
**Objetivo**: Monitorear ingresos vs gastos diarios en un período mensual  
**Flujo**:
1. Usuario selecciona período "Mes" 
2. Visualiza ingresos diarios (barras verdes) vs gastos diarios (barras rojas)
3. Observa líneas acumuladas para entender tendencias
4. Identifica días de alto gasto o ingresos irregulares
5. Revisa análisis automático de superávit/déficit

#### 5.1.2 Análisis de Tendencias Acumulativas
**Actor**: Planificador financiero personal  
**Objetivo**: Rastrear cómo se acumulan gastos vs ingresos a lo largo del tiempo  
**Flujo**:
1. Usuario examina líneas acumuladas (roja para gastos, verde para ingresos)
2. Identifica puntos donde gastos acumulados superan ingresos acumulados
3. Usa tooltip para obtener valores exactos en fechas específicas
4. Compara diferentes períodos cambiando el selector temporal

#### 5.1.3 Detección de Patrones Financieros  
**Actor**: Usuario analítico  
**Objetivo**: Identificar patrones de comportamiento financiero  
**Flujo**:
1. Usuario navega entre diferentes períodos (semana, mes, año)
2. Observa patrones recurrentes en el gráfico
3. Identifica días problemáticos consistentes
4. Usa métricas de resumen para validar hipótesis

### 5.2 Escenarios Específicos

#### 5.2.1 Ingreso Mensual (Salario)
- **Situación**: Usuario recibe salario el primer día del mes
- **Comportamiento**: Barra verde alta el día 1, línea verde acumulada se mantiene constante
- **Análisis**: Sistema muestra superávit inicial que puede cambiar según gastos

#### 5.2.2 Gastos Distribuidos
- **Situación**: Gastos regulares distribuidos a lo largo del mes
- **Comportamiento**: Barras rojas variables, línea roja acumulada creciente
- **Análisis**: Balance diario fluctúa, análisis global muestra tendencia real

#### 5.2.3 Período Sin Actividad
- **Situación**: Días sin ingresos ni gastos
- **Comportamiento**: Barras en cero, líneas acumuladas mantienen último valor
- **Análisis**: Sistema mantiene consistencia de datos acumulados

#### 5.2.4 Ejemplo de Balance Acumulativo
- **Situación**: Balance diario mostrando progresión acumulativa
- **Ejemplo**:
  - Día 1: ingreso 500, gastos 0, balance acumulado: 500 (500 - 0)
  - Día 2: ingreso 0, gastos 10, balance acumulado: 490 (500 - 10)  
  - Día 3: ingreso 200, gastos 50, balance acumulado: 640 (700 - 60)
- **Comportamiento**: El balance en tooltip muestra la suma acumulativa de todos los ingresos menos todos los gastos hasta esa fecha
- **Análisis**: Permite visualizar la evolución real del patrimonio día a día

---

## 6. Validación y Testing

### 6.1 Criterios de Validación
- **Independencia Temporal**: Tests deben pasar independientemente de la fecha del sistema
- **Consistencia de Cálculos**: Balances y acumulados matemáticamente correctos
- **Manejo de Zonas Horarias**: Funcionamiento correcto en diferentes zonas horarias
- **Casos Límite**: Períodos sin datos, fechas extremas, valores monetarios grandes

### 6.2 Escenarios de Testing Implementados
- Procesamiento de ingreso único el primer día del mes
- Consistencia de resultados independiente de fecha del sistema
- Manejo de casos límite de zona horaria
- Validación de datos para períodos completos (31 días para agosto)

---

## 7. Limitaciones y Mejoras Futuras

### 7.1 Limitaciones Actuales
- **Navegación Temporal**: No hay navegación entre meses/años específicos
- **Filtros**: Sin capacidad de filtrar por categorías de ingresos/gastos
- **Exportación**: No incluye funcionalidad de exportar datos o gráficos
- **Predicciones**: Sin proyecciones futuras más allá del período actual
- **Alertas**: No hay sistema de notificaciones automáticas

### 7.2 Roadmap de Mejoras
#### 7.2.1 Fase 2 - Navegación Avanzada
- Selector de fechas específicas
- Navegación entre períodos históricos
- Comparación entre períodos

#### 7.2.2 Fase 3 - Análisis Inteligente
- Predicciones basadas en histórico
- Detección automática de anomalías
- Alertas configurables por usuario

#### 7.2.3 Fase 4 - Personalización
- Filtros por categorías
- Métricas personalizables
- Exportación a PDF/Excel
- Temas de color personalizados

---

## 8. Conclusiones

El componente **FinancialChart** representa una solución robusta y bien arquitecturada para visualización financiera personal. Su diseño modular, optimizaciones de rendimiento, y enfoque en la experiencia de usuario lo posicionan como el componente central del sistema de análisis financiero de Fianzas Manager.

La implementación actual cumple efectivamente con los requisitos core de visualización y análisis, mientras que mantiene un roadmap claro para mejoras futuras que agregarán valor significativo al producto.

---

**Documento generado a partir del análisis del código existente en:**
- `/frontend/src/features/dashboard/components/FinancialChart/FinancialChart.component.tsx`
- `/frontend/src/features/dashboard/components/FinancialChart/useFinancialChartData.test.ts`