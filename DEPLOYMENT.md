# Deployment Guide for Fianzas Manager

## Build Status ✅

Both frontend and backend builds are passing successfully:
- **Frontend**: Build completed with only minor warnings about chunk sizes
- **Backend**: Build completed successfully with Prisma client generation
- **Latest Commit**: `07afc6b feat: improve filters` (pushed to main branch)

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional)
- SSL certificate (for production)

#### Steps

1. **Create production environment file**:
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your secure values
   ```

2. **Build and run with Docker Compose**:
   ```bash
   # For production deployment
   docker-compose -f docker-compose.production.yml --env-file .env.production up -d --build
   
   # To view logs
   docker-compose -f docker-compose.production.yml logs -f
   
   # To stop services
   docker-compose -f docker-compose.production.yml down
   ```

3. **Verify deployment**:
   - Frontend: http://localhost (or your domain)
   - Backend API: http://localhost:3001/api/health
   - Database: PostgreSQL on port 5432 (internal)

### Option 2: Cloud Platform Deployment

#### Vercel (Frontend) + Railway/Render (Backend)

**Frontend on Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. From frontend directory:
   ```bash
   cd frontend
   vercel --prod
   ```
3. Set environment variable: `VITE_API_URL` to your backend URL

**Backend on Railway/Render:**
1. Connect your GitHub repository
2. Set environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Your secure JWT secret
   - `CORS_ORIGIN`: Your frontend URL
   - `NODE_ENV`: production

#### Heroku Deployment

1. **Install Heroku CLI**
2. **Create Heroku apps**:
   ```bash
   heroku create fianzas-manager-api
   heroku create fianzas-manager-web
   ```

3. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev -a fianzas-manager-api
   ```

4. **Deploy**:
   ```bash
   # Backend
   git subtree push --prefix backend heroku-api main
   
   # Frontend (using buildpack)
   git subtree push --prefix frontend heroku-web main
   ```

### Option 3: VPS Deployment

#### Using the provided Docker setup on a VPS

1. **SSH into your VPS**
2. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/fianzas-manager.git
   cd fianzas-manager
   ```

3. **Install Docker and Docker Compose**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. **Configure environment**:
   ```bash
   cp .env.production.example .env.production
   nano .env.production  # Edit with your values
   ```

5. **Run with Docker Compose**:
   ```bash
   docker-compose -f docker-compose.production.yml --env-file .env.production up -d
   ```

6. **Setup Nginx reverse proxy** (optional):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:80;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
       }
   }
   ```

## Environment Variables

### Required Backend Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secure random string (min 32 characters)
- `CORS_ORIGIN`: Frontend URL
- `NODE_ENV`: production
- `PORT`: 3001 (default)

### Required Frontend Variables
- `VITE_API_URL`: Backend API URL

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificate installed (for production)
- [ ] Backup strategy implemented
- [ ] Monitoring setup (optional)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Health check endpoints verified

## Monitoring

### Health Checks
- Backend: `GET /api/health`
- Database: Check PostgreSQL connection
- Frontend: Check static asset loading

### Recommended Monitoring Tools
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: LogDNA, Papertrail
- **Performance**: New Relic, DataDog
- **Errors**: Sentry, Rollbar

## Database Backup

### Manual Backup
```bash
docker exec fianzas_db pg_dump -U fianzas_user fianzas_manager > backup_$(date +%Y%m%d).sql
```

### Automated Backup (cron)
```bash
0 2 * * * docker exec fianzas_db pg_dump -U fianzas_user fianzas_manager > /backups/backup_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check network connectivity

2. **CORS errors**:
   - Verify CORS_ORIGIN matches frontend URL
   - Check API endpoint configuration

3. **Build failures**:
   - Clear node_modules and reinstall
   - Check Node.js version (v20 recommended)
   - Verify all dependencies are installed

4. **Port conflicts**:
   - Change ports in docker-compose.yml
   - Check for running services on ports 80, 3001, 5432

## Security Recommendations

1. **Use strong passwords** for database and JWT secret
2. **Enable SSL/TLS** for production deployments
3. **Implement rate limiting** on API endpoints
4. **Regular security updates** for dependencies
5. **Database access** restricted to application only
6. **Environment variables** never committed to git
7. **Regular backups** with offsite storage

## Support

For issues or questions about deployment:
1. Check application logs
2. Verify environment variables
3. Test health endpoints
4. Review this documentation

## Quick Start Commands

```bash
# Development
npm run dev  # In both frontend and backend directories

# Production with Docker
docker-compose -f docker-compose.production.yml up -d --build

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker-compose.production.yml down

# Database backup
docker exec fianzas_db pg_dump -U fianzas_user fianzas_manager > backup.sql
```