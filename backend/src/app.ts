import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './services';
import { errorHandler, notFoundHandler } from './middleware';
import routes from './routes';

// Load environment variables
dotenv.config();

const app: Application = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Connect to database
connectDatabase();

// API Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fianzas Manager API is running!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      auth: '/api/auth',
      incomes: '/api/incomes',
      expenses: '/api/expenses',
      categories: '/api/categories',
      mercadopago: '/api/mercadopago',
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;