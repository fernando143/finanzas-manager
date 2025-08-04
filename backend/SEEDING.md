# Database Seeding Configuration

This document explains the database seeding setup for both development and Railway deployment.

## Problem Solved

The seed.ts file was importing from an outdated Prisma client location (`../src/generated/prisma`) instead of the standard `@prisma/client`. This was causing seed failures in both development and deployment.

## Solution Implemented

### 1. Fixed Prisma Client Import
- Updated `prisma/seed.ts` to import from `@prisma/client`
- Aligned with the Prisma schema configuration that uses standard client generation

### 2. Enhanced Package.json Scripts
```json
{
  "db:seed": "tsx prisma/seed.ts",
  "deploy": "bash scripts/deploy.sh",
  "railway:build": "prisma generate && npx tsc",
  "railway:start": "npm run deploy && node dist/server.js",
  "dev:seed": "npm run db:seed && npm run dev"
}
```

### 3. Intelligent Deployment Script
Created `scripts/deploy.sh` that:
- Generates Prisma client
- Runs database migrations
- Checks if seeding is needed before running seed
- Only seeds if database is empty or missing data

### 4. Seed Check System
Created `scripts/check-seed.ts` that intelligently determines if seeding is needed by checking:
- Existence of test user
- Presence of default categories
- Existence of default account

### 5. Railway Configuration
Created `railway.toml` with proper:
- Build commands that include Prisma generation
- Start commands that handle deployment preparation
- Health check configuration

## Usage

### Development

#### Run seed manually:
```bash
npm run db:seed
```

#### Start development with fresh seeding:
```bash
npm run dev:seed
```

#### Normal development (no seeding):
```bash
npm run dev
```

### Production/Railway

The deployment process is automatic:
1. Railway runs `npm run railway:build` (generates client + compiles TypeScript)
2. Railway runs `npm run railway:start` which:
   - Executes the deploy script
   - Runs migrations
   - Checks if seeding is needed
   - Seeds database if needed
   - Starts the server

### Manual Deployment Testing

Test the deployment process locally:
```bash
npm run deploy
```

## Seed Data

The seed creates:
- **Test User**: `test@fianzas.com` (password: `test123`)
- **63 Categories**: 18 income categories + 45 expense categories
- **Default Account**: Primary checking account for the test user

## Seed Safety Features

1. **Idempotent**: Uses `upsert` operations, safe to run multiple times
2. **Smart Detection**: Only runs when needed, prevents unnecessary operations
3. **Error Handling**: Proper error handling and process exit codes
4. **Logging**: Clear logging for debugging deployment issues

## Files Created/Modified

### New Files:
- `scripts/deploy.sh` - Deployment orchestration script
- `scripts/check-seed.ts` - Intelligent seed detection
- `railway.toml` - Railway deployment configuration
- `SEEDING.md` - This documentation file

### Modified Files:
- `prisma/seed.ts` - Fixed Prisma client import
- `package.json` - Added deployment and development scripts

## Troubleshooting

### Seed Fails in Development
```bash
# Regenerate Prisma client
npm run db:generate

# Check database connection
npm run db:studio

# Run seed manually
npm run db:seed
```

### Seed Fails in Railway
1. Check Railway logs for specific errors
2. Verify DATABASE_URL environment variable
3. Ensure migrations have run successfully
4. Check if tsx package is available in production

### Force Re-seed
If you need to force a re-seed:
```bash
# Reset database (removes all data)
npm run db:reset

# Or delete specific test data and re-run seed
npm run db:seed
```

## Environment Variables

Required for production:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production" for Railway
- `PORT`: Server port (Railway sets this automatically)

## Health Checks

The system includes health checks at:
- `/api/health` - API health endpoint
- Database connection verification on startup
- Migration status verification during deployment