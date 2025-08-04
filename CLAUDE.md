# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fianzas Manager is a personal finance management web application built with a TypeScript-first approach. The application provides comprehensive financial tracking including income/expense management, debt tracking, investment portfolio management, and savings goals planning.

## Architecture

### Monorepo Structure
- `backend/` - Node.js Express API with TypeScript
- `backend/frontend/` - React + Vite frontend application (NOTE: Currently incorrectly nested, should be moved to root level)
- `PRD.md` - Product Requirements Document with complete feature specifications

### Technology Stack

**Backend:**
- Node.js + Express with TypeScript
- TypeScript compilation target: ES2020
- Dependencies: express, cors, dotenv
- Dev Dependencies: nodemon, ts-node, @types/* packages

**Frontend:**
- React 19 with TypeScript
- Vite as build tool and dev server
- ESLint for code quality
- Modern TypeScript configuration

## Development Commands

### Backend Development
```bash
cd backend
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run build       # Compile TypeScript (when src/ structure is implemented)
```

### Frontend Development
```bash
cd backend/frontend  # Note: Should be moved to frontend/ at root level
npm run dev         # Start Vite dev server
npm run build       # Build for production (TypeScript + Vite)
npm run lint        # Run ESLint
npm run preview     # Preview production build
```

## Current Implementation Status

### Backend
- Basic Express server setup with CORS and JSON middleware
- Health check endpoint at `/api/health`
- TypeScript configuration ready but source code still in JavaScript
- Environment configuration with .env file
- **TODO**: Migrate index.js to TypeScript and implement src/ structure

### Frontend
- React + TypeScript + Vite setup complete
- ESLint configuration with React-specific rules
- Modern TypeScript configuration with strict mode
- **TODO**: Implement financial management UI components

## Key Implementation Notes

### Project Structure Issues
- Frontend is currently nested inside `backend/frontend/` - should be moved to root level `frontend/`
- Backend source code is in JavaScript but TypeScript configuration expects `src/` directory structure

### Financial Domain Requirements
Based on PRD.md, the application requires:
- Income/expense tracking with categorization
- Payment due date management with alerts
- Debt management with payment strategies
- Investment portfolio tracking
- Savings goals (short/medium/long term)
- Budget creation and monitoring
- Financial reporting and analytics

### TypeScript Configuration
- Both backend and frontend use strict TypeScript
- Backend: CommonJS modules, ES2020 target
- Frontend: ES modules, modern React patterns
- Source maps and declarations enabled for debugging

## Development Workflow

1. **Backend Development**: Convert existing JS to TS, implement API endpoints for financial entities
2. **Frontend Development**: Create React components for financial data management
3. **Integration**: Connect frontend to backend API with proper TypeScript interfaces
4. **Database**: Add database layer (PostgreSQL or MongoDB as per PRD)

## Database Schema Planning
The application will need entities for:
- Users (authentication)
- Income/Expense categories and transactions
- Payment schedules and due dates
- Debts and payment strategies
- Investments and portfolio tracking
- Savings goals and progress tracking
- Budgets and budget allocations

## Development Principles

### Feature Development Guidelines
- Always design and create features with a Minimum Viable Product (MVP) approach
- Minimize complexity in validations and use cases
- Focus on implementing only the essential functionality
- Avoid over-engineering features
- Prioritize simplicity and core user needs