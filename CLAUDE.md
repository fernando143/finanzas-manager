# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fianzas Manager is a personal finance management web application built with a TypeScript-first approach. The application provides comprehensive financial tracking including income/expense management, debt tracking, investment portfolio management, and savings goals planning.

## Architecture

### Monorepo Structure
- `backend/` - Node.js Express API with TypeScript and Prisma ORM
- `frontend/` - React 19 + Vite + TypeScript frontend application
- `database/` - PostgreSQL database with Docker support

### Technology Stack

#### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5.1
- **ORM**: Prisma 6.13 with PostgreSQL
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod 4.0
- **Testing**: Jest + Supertest

#### Frontend
- **Framework**: React 19.1 with TypeScript 5.8
- **Build Tool**: Vite 7.0
- **State Management**: Zustand 5.0
- **Data Fetching**: TanStack Query (React Query) 5.84
- **Forms**: React Hook Form 7.62 with Zod validation
- **Styling**: Tailwind CSS 3.4
- **Charts**: Recharts 3.1
- **Testing**: Vitest + Playwright

#### Database
- **DBMS**: PostgreSQL 15 (running in Docker on port 5433)
- **Admin Tool**: Adminer (running on port 8080)

## Development Commands

### Backend Development
```bash
cd backend

# Development
npm run dev                    # Start development server with nodemon
npm run build                  # Build TypeScript and generate Prisma client
npm run start                  # Production start (migrate + seed + run)

# Database
npm run db:generate            # Generate Prisma client
npm run db:migrate             # Run migrations in development
npm run db:deploy              # Deploy migrations to production
npm run db:reset               # Reset database and re-run migrations
npm run db:studio              # Open Prisma Studio GUI
npm run db:seed                # Seed database with initial data

# Testing
npm run test                   # Run all tests
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Run tests with coverage report
npm run test:setup             # Setup test database

# Code Quality
npm run lint                   # Check for linting errors
npm run lint:fix               # Fix linting errors
npm run lint:check             # Check linting with zero tolerance
```

### Frontend Development
```bash
cd frontend

# Development
npm run dev                    # Start Vite dev server
npm run build                  # Build for production
npm run preview                # Preview production build

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint issues
npm run type-check             # Check TypeScript types
npm run fix:all                # Fix lint and check types
npm run deploy:check           # Full validation before deployment

# Testing
npm run test                   # Run Vitest tests
npm run test:run               # Run tests once
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run Playwright with UI
npm run test:e2e:headed        # Run Playwright in headed mode
```

### Database Management
```bash
# Start PostgreSQL and Adminer
docker-compose up -d

# Database is accessible at:
# - PostgreSQL: localhost:5433
# - Adminer UI: http://localhost:8080
# - Credentials: fianzas_user / fianzas_secure_password_2024
```

## High-Level Architecture

### API Structure (Backend)
```
backend/src/
├── controllers/       # Request handlers with business logic
├── routes/           # API endpoint definitions
├── services/         # Business logic and database operations
├── middleware/       # Auth, validation, error handling
├── types/            # TypeScript type definitions
└── app.ts/server.ts  # Application setup and entry point
```

### Frontend Structure
```
frontend/src/
├── features/         # Feature-based modules (auth, expenses, income, etc.)
│   └── [feature]/
│       ├── components/    # Feature-specific React components
│       ├── hooks/        # Custom hooks for the feature
│       ├── services/     # API service layer
│       └── types/        # TypeScript definitions
├── shared/           # Shared utilities and components
│   ├── ui/          # Reusable UI components
│   ├── hooks/       # Shared custom hooks
│   ├── services/    # API client and auth services
│   └── utils/       # Utility functions
└── types/           # Global TypeScript definitions
```

### Database Schema
The application uses Prisma ORM with the following main entities:
- **User**: Authentication and user profile
- **Category**: Hierarchical categories for income/expenses
- **Income**: Income tracking with frequency support
- **Expense**: Expense management with due dates and payment status
- **SavingsGoal**: Short/medium/long-term savings goals
- **Investment**: Portfolio tracking
- **Budget**: Budget planning with category allocations
- **Debt**: Debt management with payment strategies
- **Account**: Multiple account support

### Key Architectural Patterns

#### API Response Format
All API endpoints return a consistent response structure:
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

#### Authentication Flow
- JWT-based authentication stored in localStorage
- Auth middleware validates tokens on protected routes
- Frontend uses axios interceptors for automatic token injection

#### Data Fetching Pattern
- TanStack Query for server state management
- Optimistic updates for better UX
- Query invalidation on mutations
- Custom hooks wrapping API calls

#### Component Organization
- Feature-based folder structure
- Component-specific hooks colocated with components
- Shared hooks in feature's hooks directory
- Consistent naming: `Component.component.tsx`, `useComponent.hook.ts`

## Development Principles

### Feature Development Guidelines
- Always design and create features with a Minimum Viable Product (MVP) approach
- Minimize complexity in validations and use cases
- Focus on implementing only the essential functionality
- Avoid over-engineering features
- Prioritize simplicity and core user needs
- Use sub-agents to preserve clean main context
- Prefer types over interfaces in TypeScript

### Code Quality Standards
- All TypeScript code must compile without errors
- ESLint must pass with zero warnings for production code
- Components follow established naming conventions
- API services use singleton pattern
- Forms use React Hook Form with Zod validation

### Testing Strategy
- Unit tests for critical business logic
- Integration tests for API endpoints
- E2E tests for critical user journeys
- Maintain test database separate from development

## Important Instructions

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files unless explicitly requested.