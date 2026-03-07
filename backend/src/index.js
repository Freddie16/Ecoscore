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

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();

// ── CORS — must be FIRST, before everything else ──────────────────────────────
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    if (origin.endsWith('.onrender.com')) return cb(null, true);
    if (origin.startsWith('http://localhost')) return cb(null, true);
    cb(null, true); // allow all for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle preflight

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false, crossOriginOpenerPolicy: false }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP logging ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Rate limiting (after CORS so preflight is never rate-limited) ─────────────
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
  skip: (req) => req.method === 'OPTIONS', // never rate-limit preflight
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

app.use('/api',          globalLimiter);
app.use('/api/auth',     authLimiter);
app.use('/api/analysis', aiLimiter);

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

// ── One-time seed endpoint (adds green funds to DB) ───────────────────────────
app.post('/api/seed-funds', async (req, res) => {
  // Simple secret check so random people can't call it
  if (req.headers['x-seed-secret'] !== (process.env.SEED_SECRET || 'ecoscore-seed-2026')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const { default: GreenFund } = await import('./models/GreenFund.js');
    const existing = await GreenFund.countDocuments();
    if (existing > 0) {
      return res.json({ success: true, message: `Already seeded (${existing} funds exist)` });
    }
    await GreenFund.insertMany([
      { name: 'Green SME Loan', provider: 'Equity Bank Kenya', maxFunding: 'KES 25,000,000', maxFundingValue: 25000000, interestRate: '8.5% p.a.', minEcoScore: 45, description: 'Preferred lending rates for SMEs with verified low carbon footprints and active waste management systems.', category: 'Loan', tags: ['environmental', 'carbon', 'sme'] },
      { name: 'Gender Parity Grant', provider: 'Mastercard Foundation', maxFunding: 'KES 5,000,000', maxFundingValue: 5000000, interestRate: '0% (Grant)', minEcoScore: 50, description: 'Targeting businesses with equitable pay structures and female workforce representation.', category: 'Grant', tags: ['social', 'gender', 'diversity'] },
      { name: 'Climate Resilience Fund', provider: 'Kenya Climate Ventures', maxFunding: 'KES 100,000,000', maxFundingValue: 100000000, interestRate: '12% p.a.', minEcoScore: 40, description: 'Growth capital for SMEs adapting supply chains to climate-related disruptions.', category: 'Loan', tags: ['climate', 'supply-chain', 'resilience'] },
      { name: 'Sustainable Agriculture Loan', provider: 'KCB Bank Kenya', maxFunding: 'KES 10,000,000', maxFundingValue: 10000000, interestRate: '10% p.a.', minEcoScore: 35, description: 'Financing for agri-SMEs adopting sustainable farming practices and organic certification.', category: 'Loan', tags: ['agriculture', 'sustainability'] },
      { name: 'AfDB Green Growth Grant', provider: 'African Development Bank', maxFunding: 'KES 50,000,000', maxFundingValue: 50000000, interestRate: '0% (Grant)', minEcoScore: 60, description: 'Pan-African grant for businesses demonstrating measurable environmental and social impact.', category: 'Grant', tags: ['pan-african', 'impact', 'scale'] },
      { name: 'IFC SME Ventures', provider: 'International Finance Corporation', maxFunding: 'KES 75,000,000', maxFundingValue: 75000000, interestRate: '9% p.a.', minEcoScore: 30, description: 'IFC-backed financing for East African SMEs with documented ESG improvement plans.', category: 'Blended', tags: ['ifc', 'east-africa', 'growth'] },
    ]);
    return res.json({ success: true, message: '✅ 6 green funds seeded successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});