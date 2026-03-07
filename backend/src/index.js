import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';
import logger from './utils/logger.js';

// Routes
import authRoutes        from './routes/auth.js';
import supplierRoutes    from './routes/suppliers.js';
import analysisRoutes    from './routes/analysis.js';
import carbonRoutes      from './routes/carbon.js';
import marketplaceRoutes from './routes/marketplace.js';
import dashboardRoutes   from './routes/dashboard.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

// Handle preflight for all routes first
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    if (origin.endsWith('.onrender.com')) return cb(null, true);
    if (origin.startsWith('http://localhost')) return cb(null, true);
    cb(null, true); // allow all during development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'AI rate limit reached. Please wait before trying again.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

app.use('/api',          globalLimiter);
app.use('/api/auth',     authLimiter);
app.use('/api/analysis', aiLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP logging ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'EcoScore.AI API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/suppliers',   supplierRoutes);
app.use('/api/analysis',    analysisRoutes);
app.use('/api/carbon',      carbonRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.all('/{*path}', (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
});

// ── Global error handler (must be LAST middleware) ────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.success(`EcoScore.AI API  →  http://localhost:${PORT}/api`);
  logger.info(`Environment      →  ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health           →  http://localhost:${PORT}/api/health`);
});

export default app;