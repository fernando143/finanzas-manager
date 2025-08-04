# Fianzas Manager - React Way of Working

## 📋 Project Overview

**Fianzas Manager** is a comprehensive personal finance management application built with React, TypeScript, and Vite. This document establishes the standards, patterns, and best practices for frontend development in this project.

### Tech Stack
- **Framework**: React 19.1+ with TypeScript
- **Build Tool**: Vite 7.0+
- **Package Manager**: npm
- **Linting**: ESLint with TypeScript support
- **Language**: TypeScript 5.8+

---

## 🏗️ Project Architecture

### Core Principles
1. **Feature-Based Organization**: Code organized by business features, not technical layers
2. **Shared Resources**: Common components, utilities, and services in dedicated shared modules
3. **Type Safety**: Comprehensive TypeScript usage with strict configuration
4. **Modularity**: Self-contained modules with clear interfaces
5. **Scalability**: Architecture prepared for growth and team collaboration

### Folder Structure

```
src/
├── main.tsx                    # Application entry point
├── App.tsx                     # Root component
├── types/                      # Global type definitions
│   ├── api.ts                  # API response types
│   ├── common.ts               # Common shared types
│   └── index.ts                # Type exports
├── shared/                     # Shared resources across features
│   ├── ui/                     # Reusable UI components
│   │   ├── components/         # Generic UI components
│   │   ├── layouts/            # Layout components
│   │   └── index.ts            # UI exports
│   ├── services/              # Shared services
│   │   ├── api/               # API client and configuration
│   │   ├── auth/              # Authentication services
│   │   ├── storage/           # Local storage utilities
│   │   └── index.ts           # Service exports
│   ├── hooks/                 # Shared custom hooks
│   ├── utils/                 # Utility functions
│   ├── constants/             # Application constants
│   └── context/               # Global context providers
└── features/                  # Feature-specific modules
    ├── dashboard/             # Dashboard feature
    ├── income/                # Income management
    ├── expenses/              # Expense management
    ├── savings-goals/         # Savings goals
    ├── investments/           # Investment tracking
    ├── reports/               # Reports and analytics
    └── auth/                  # Authentication features
```

### Feature Module Structure

Each feature follows a consistent internal structure:

```
features/[feature-name]/
├── index.ts                   # Feature public exports
├── components/                # Feature-specific components
│   ├── FeatureName/           # Multi-file component directory
│   │   ├── FeatureName.component.tsx
│   │   ├── useFeatureName.hook.ts
│   │   ├── FeatureName.types.ts
│   │   └── FeatureName.module.css
│   ├── SimpleComponent.component.tsx  # Single-file component
│   └── index.ts              # Component exports
├── hooks/                     # Shared feature hooks (used by multiple components)
│   ├── use[FeatureName].hook.ts
│   ├── use[HookName].hook.ts
│   └── index.ts              # Hook exports
├── context/                   # Feature state management
│   ├── [FeatureName].context.tsx
│   └── index.ts              # Context exports
├── services/                  # Feature-specific services
│   ├── [featureName].service.ts
│   └── index.ts              # Service exports
├── types/                     # Feature-specific types
│   ├── [featureName].types.ts
│   └── index.ts              # Type exports
└── utils/                     # Feature-specific utilities
    ├── [featureName].utils.ts
    └── index.ts              # Utility exports
```

---

## 📝 Naming Conventions

### Files and Directories
- **Components**: `PascalCase.component.tsx`
  - Example: `Dashboard.component.tsx`, `IncomeForm.component.tsx`
- **Hooks**: `usePascalCase.hook.ts`
  - Example: `useDashboard.hook.ts`, `useIncomeForm.hook.ts`
- **Context**: `PascalCase.context.tsx`
  - Example: `Dashboard.context.tsx`, `Auth.context.tsx`
- **Services**: `camelCase.service.ts`
  - Example: `incomeService.service.ts`, `authService.service.ts`
- **Types**: `camelCase.types.ts`
  - Example: `dashboard.types.ts`, `income.types.ts`
- **Utils**: `camelCase.utils.ts`
  - Example: `dateFormat.utils.ts`, `validation.utils.ts`
- **Directories**: `kebab-case`
  - Example: `savings-goals/`, `user-profile/`

### Code Elements
- **Components**: `PascalCase`
  - Example: `DashboardWidget`, `IncomeFormModal`
- **Hooks**: `usePascalCase`
  - Example: `useDashboardData`, `useIncomeValidation`
- **Functions**: `camelCase`
  - Example: `calculateTotalIncome`, `formatCurrency`
- **Variables**: `camelCase`
  - Example: `totalAmount`, `isLoading`
- **Constants**: `UPPER_SNAKE_CASE`
  - Example: `API_BASE_URL`, `MAX_RETRY_ATTEMPTS`
- **Types/Interfaces**: `PascalCase`
  - Example: `IncomeData`, `ExpenseFormProps`

---

## 🧩 Component Patterns

### Component Structure Template

```typescript
// Income.component.tsx
import React from 'react';
import { useIncome } from '../hooks';
import { IncomeProps } from '../types';
import './Income.component.css'; // Optional: component-specific styles

export const Income: React.FC<IncomeProps> = ({
  id,
  onUpdate,
  className,
  ...props
}) => {
  // Hooks
  const { income, isLoading, error, updateIncome } = useIncome(id);
  
  // Event handlers
  const handleUpdate = (data: IncomeUpdateData) => {
    updateIncome(data);
    onUpdate?.(data);
  };
  
  // Early returns
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!income) return null;
  
  // Render
  return (
    <div className={`income-component ${className || ''}`} {...props}>
      {/* Component content */}
    </div>
  );
};

// Default export for lazy loading
export default Income;
```

### Component Categories

#### 1. Feature Components
- **Purpose**: Main feature entry points
- **Location**: `features/[feature]/components/[Feature].component.tsx`
- **Naming**: Feature name in PascalCase
- **Example**: `Dashboard.component.tsx`, `IncomeManagement.component.tsx`

#### 2. UI Components
- **Purpose**: Reusable interface elements
- **Location**: `shared/ui/components/`
- **Props**: Always accept `className` and spread props
- **Example**: `Button.component.tsx`, `Modal.component.tsx`

#### 3. Layout Components
- **Purpose**: Page structure and navigation
- **Location**: `shared/ui/layouts/`
- **Example**: `MainLayout.component.tsx`, `AuthLayout.component.tsx`

---

## 🔧 Custom Hooks

### Hook Structure Template

```typescript
// useIncome.hook.ts
import { useState, useEffect, useCallback } from 'react';
import { incomeService } from '../services';
import { Income, IncomeFormData } from '../types';

interface UseIncomeReturn {
  income: Income | null;
  incomes: Income[];
  isLoading: boolean;
  error: Error | null;
  createIncome: (data: IncomeFormData) => Promise<void>;
  updateIncome: (id: string, data: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  refreshIncomes: () => Promise<void>;
}

export const useIncome = (initialId?: string): UseIncomeReturn => {
  const [income, setIncome] = useState<Income | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Implementation...
  
  return {
    income,
    incomes,
    isLoading,
    error,
    createIncome,
    updateIncome,
    deleteIncome,
    refreshIncomes,
  };
};
```

### Hook Categories

#### 1. Data Hooks
- **Purpose**: API data management and state
- **Pattern**: `use[Resource]` (e.g., `useIncome`, `useExpenses`)
- **Returns**: Data, loading state, error state, CRUD operations

#### 2. Form Hooks
- **Purpose**: Form state and validation
- **Pattern**: `use[Resource]Form` (e.g., `useIncomeForm`, `useExpenseForm`)
- **Returns**: Form values, validation errors, submit handlers

#### 3. UI State Hooks
- **Purpose**: UI state management
- **Pattern**: `use[UIElement]` (e.g., `useModal`, `useToast`)
- **Returns**: UI state, toggle functions, configuration

### Hook Placement Guidelines

#### Component-Specific Hooks

**Single File Components:**
When a hook is related to a single component and not shared across the feature, it should be placed as close as possible to the component it serves:

```
components/
├── SimpleComponent.component.tsx
├── useSimpleComponent.hook.ts      # Hook specific to SimpleComponent
├── AnotherSimpleComponent.component.tsx
└── useAnotherSimpleComponent.hook.ts
```

**Multi-File Components:**
When a component has multiple related files (custom hook, types, utils, styles, etc.), all related files should be organized within a directory named after the component:

```
components/
├── FinancialChart/                    # Component directory
│   ├── FinancialChart.component.tsx   # Main component
│   ├── useFinancialChart.hook.ts      # Component-specific hook
│   ├── FinancialChart.types.ts        # Component-specific types (optional)
│   ├── FinancialChart.utils.ts        # Component-specific utilities (optional)
│   └── FinancialChart.module.css      # Component-specific styles (optional)
├── IncomeForm/                        # Another component directory
│   ├── IncomeForm.component.tsx
│   ├── useIncomeForm.hook.ts
│   └── IncomeForm.types.ts
└── SimpleButton.component.tsx         # Single file component (no directory needed)
```

**Decision Criteria:**
- **Single file**: Component only needs the `.component.tsx` file
- **Component directory**: Component has 2+ related files (hook, types, utils, styles, etc.)

**Naming Convention within Component Directories:**
- Main component: `[ComponentName].component.tsx`
- Component hook: `use[ComponentName].hook.ts`
- Component types: `[ComponentName].types.ts`
- Component utils: `[ComponentName].utils.ts`
- Component styles: `[ComponentName].module.css`

#### Shared Feature Hooks
Hooks that are used by multiple components within a feature should be placed in the feature's `hooks/` directory:

```
features/dashboard/
├── components/
│   ├── Dashboard.component.tsx
│   └── Widget.component.tsx
└── hooks/
    ├── useDashboard.hook.ts       # Used by multiple components
    └── index.ts
```

---

## 🔄 State Management

### Context Pattern

```typescript
// Dashboard.context.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface DashboardState {
  selectedPeriod: 'month' | 'quarter' | 'year';
  widgets: Widget[];
  isLoading: boolean;
}

type DashboardAction =
  | { type: 'SET_PERIOD'; payload: DashboardState['selectedPeriod'] }
  | { type: 'SET_WIDGETS'; payload: Widget[] }
  | { type: 'SET_LOADING'; payload: boolean };

interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  // Derived values
  filteredData: any[];
  // Action creators
  setPeriod: (period: DashboardState['selectedPeriod']) => void;
  setWidgets: (widgets: Widget[]) => void;
}

// Initial state
const initialState: DashboardState = {
  selectedPeriod: 'month',
  widgets: [],
  isLoading: false,
};

// Reducer
const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_PERIOD':
      return { ...state, selectedPeriod: action.payload };
    case 'SET_WIDGETS':
      return { ...state, widgets: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider
export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  
  // Action creators
  const setPeriod = (period: DashboardState['selectedPeriod']) => {
    dispatch({ type: 'SET_PERIOD', payload: period });
  };
  
  const setWidgets = (widgets: Widget[]) => {
    dispatch({ type: 'SET_WIDGETS', payload: widgets });
  };
  
  // Derived values
  const filteredData = useMemo(() => {
    // Compute filtered data based on state
    return [];
  }, [state.selectedPeriod, state.widgets]);
  
  const value = {
    state,
    dispatch,
    filteredData,
    setPeriod,
    setWidgets,
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Hook
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
```

---

## 🌐 API Integration

### Service Pattern

```typescript
// incomeService.service.ts
import { apiClient } from '../../shared/services/api';
import { Income, IncomeFormData, ApiResponse } from '../types';

class IncomeService {
  private readonly baseUrl = '/api/incomes';
  
  async getAll(): Promise<Income[]> {
    const response = await apiClient.get<ApiResponse<Income[]>>(this.baseUrl);
    return response.data.data || [];
  }
  
  async getById(id: string): Promise<Income> {
    const response = await apiClient.get<ApiResponse<Income>>(`${this.baseUrl}/${id}`);
    if (!response.data.data) {
      throw new Error('Income not found');
    }
    return response.data.data;
  }
  
  async create(data: IncomeFormData): Promise<Income> {
    const response = await apiClient.post<ApiResponse<Income>>(this.baseUrl, data);
    if (!response.data.data) {
      throw new Error('Failed to create income');
    }
    return response.data.data;
  }
  
  async update(id: string, data: Partial<IncomeFormData>): Promise<Income> {
    const response = await apiClient.patch<ApiResponse<Income>>(`${this.baseUrl}/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update income');
    }
    return response.data.data;
  }
  
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

// Singleton instance
export const incomeService = new IncomeService();
```

### API Client Configuration

```typescript
// shared/services/api/client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiClient {
  private instance: AxiosInstance;
  
  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  // HTTP methods
  async get<T>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url);
  }
  
  async post<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data);
  }
  
  async patch<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data);
  }
  
  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url);
  }
}

export const apiClient = new ApiClient();
```

---

## 📊 TypeScript Standards

### Type Definitions

```typescript
// Feature-specific types
export interface Income {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  frequency: FrequencyType;
  nextDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form data types (usually omit server-generated fields)
export interface IncomeFormData {
  description: string;
  amount: number;
  category: string;
  frequency: FrequencyType;
  nextDate?: string;
  isActive?: boolean;
}

// Component prop types
export interface IncomeListProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  className?: string;
  isLoading?: boolean;
}

// Hook return types
export interface UseIncomeReturn {
  incomes: Income[];
  isLoading: boolean;
  error: Error | null;
  createIncome: (data: IncomeFormData) => Promise<void>;
  updateIncome: (id: string, data: Partial<IncomeFormData>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}
```

### Type Organization

- **Global Types**: `src/types/` - API responses, common interfaces
- **Feature Types**: `features/[feature]/types/` - Feature-specific types
- **Component Types**: Inline with component or in feature types
- **Utility Types**: `shared/types/` - Generic utilities and helpers

---

## 🎨 Styling Approach

### CSS Modules Pattern

```typescript
// Component with CSS Modules
import styles from './Income.module.css';

export const Income: React.FC<IncomeProps> = ({ className, ...props }) => {
  return (
    <div className={`${styles.income} ${className || ''}`}>
      <h2 className={styles.title}>Income Details</h2>
      <div className={styles.content}>
        {/* Content */}
      </div>
    </div>
  );
};
```

### Style Guidelines

1. **CSS Modules**: For component-specific styles
2. **Global Styles**: For application-wide styles (typography, colors, spacing)
3. **Utility Classes**: For common patterns (margins, padding, flex)
4. **BEM Methodology**: For CSS class naming when not using modules
5. **CSS Custom Properties**: For theming and dynamic values

---

## 🚀 Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

### Development Commands

```bash
# Start development
npm run dev

# Development with specific port
npm run dev -- --port 3001

# Build and preview
npm run build && npm run preview

# Lint with auto-fix
npm run lint -- --fix
```

### Code Quality Checks

1. **TypeScript Compilation**: No TypeScript errors
2. **ESLint**: No linting errors or warnings
3. **File Naming**: Consistent with naming conventions
4. **Import Organization**: Sorted and grouped logically
5. **Component Structure**: Follows established patterns

---

## 📁 Import/Export Patterns

### Import Order

```typescript
// 1. External libraries
import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal modules (absolute paths)
import { Button } from '@/shared/ui/components';
import { useAuth } from '@/shared/hooks';
import { ApiResponse } from '@/types';

// 3. Relative imports (same feature)
import { useIncome } from '../hooks';
import { IncomeForm } from './IncomeForm.component';
import { IncomeProps } from '../types';

// 4. Asset imports
import styles from './Income.module.css';
import iconSrc from '../assets/income-icon.svg';
```

### Export Patterns

```typescript
// Named exports (preferred)
export const Income: React.FC<IncomeProps> = () => { /* ... */ };
export const IncomeList: React.FC<IncomeListProps> = () => { /* ... */ };

// Default export for main component
export default Income;

// Index file exports
export { Income } from './Income.component';
export { IncomeList } from './IncomeList.component';
export { IncomeForm } from './IncomeForm.component';
```

---

## 🧪 Testing Strategy

### Testing Philosophy

1. **Unit Tests**: Individual components and hooks
2. **Integration Tests**: Feature workflows and API integration
3. **End-to-End Tests**: Complete user journeys
4. **Accessibility Tests**: Screen reader and keyboard navigation

### Test File Structure

```
features/income/
├── components/
│   ├── Income.component.tsx
│   ├── Income.test.tsx
│   ├── IncomeForm.component.tsx
│   └── IncomeForm.test.tsx
├── hooks/
│   ├── useIncome.hook.ts
│   └── useIncome.test.ts
└── services/
    ├── incomeService.service.ts
    └── incomeService.test.ts
```

---

## ⚡ Performance Considerations

### Optimization Strategies

1. **Code Splitting**: Feature-based lazy loading
2. **Memoization**: React.memo, useMemo, useCallback
3. **Bundle Analysis**: Regular bundle size monitoring
4. **Image Optimization**: WebP format, lazy loading
5. **API Optimization**: Request caching, pagination

### Performance Patterns

```typescript
// Lazy loading features
const Dashboard = lazy(() => import('./features/dashboard'));
const Income = lazy(() => import('./features/income'));

// Memoized components
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Optimized hooks
export const useOptimizedData = (id: string) => {
  const data = useMemo(() => {
    return processExpensiveData(id);
  }, [id]);
  
  return data;
};
```

---

## 🔐 Security Best Practices

### Frontend Security

1. **Input Validation**: Client-side validation for UX, server-side for security
2. **XSS Prevention**: Proper data sanitization and escaping
3. **Authentication**: Secure token storage and management
4. **Environment Variables**: Sensitive data in environment variables
5. **HTTPS**: All communication over HTTPS in production

### Security Patterns

```typescript
// Secure token storage
const useAuth = () => {
  const getToken = () => localStorage.getItem('authToken');
  const setToken = (token: string) => {
    localStorage.setItem('authToken', token);
  };
  const clearToken = () => {
    localStorage.removeItem('authToken');
  };
  
  return { getToken, setToken, clearToken };
};

// Input sanitization
const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
```

---

## 📋 Code Review Checklist

### Before Submitting PR

- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] All tests pass
- [ ] Component follows naming conventions
- [ ] Props are properly typed
- [ ] Hooks are used correctly
- [ ] No console.log statements
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Accessibility considerations

### Review Guidelines

- **Functionality**: Does the code work as intended?
- **Architecture**: Does it follow project patterns?
- **Performance**: Are there any performance concerns?
- **Security**: Are there any security vulnerabilities?
- **Maintainability**: Is the code readable and maintainable?
- **Testing**: Is the code properly tested?

---

## 📚 Resources and References

### Documentation

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [ESLint Rules](https://eslint.org/docs/rules/)

### Internal References

- **PRD.md**: Product requirements and feature specifications
- **Backend CLAUDE.md**: API documentation and backend integration
- **Design System**: UI component library and design tokens

---

## 🔄 Changelog and Updates

This document should be updated when:
- New patterns or conventions are established
- Technology stack changes
- Architecture decisions are made
- Best practices evolve

**Last Updated**: January 2025
**Version**: 1.0.0
**Contributors**: Development Team

---

*This document serves as the single source of truth for React development standards in the Fianzas Manager project. All team members should follow these conventions to ensure code consistency, maintainability, and quality.*