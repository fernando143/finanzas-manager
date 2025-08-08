# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fianzas Manager is a personal finance management web application built with a TypeScript-first approach. The application provides comprehensive financial tracking including income/expense management, debt tracking, investment portfolio management, and savings goals planning.

## Architecture

### Monorepo Structure
- `backend/` - Node.js Express API with TypeScript
- `frontend/` - React + Vite frontend application

## Development Principles

### Feature Development Guidelines
- Always design and create features with a Minimum Viable Product (MVP) approach
- Minimize complexity in validations and use cases
- Focus on implementing only the essential functionality
- Avoid over-engineering features
- Prioritize simplicity and core user needs

When users need to deploy, use sub agent deploy-orchestrator to manage the deployment process.
When users need manage git, use sub agent git-flow-manager to handle git operations.
