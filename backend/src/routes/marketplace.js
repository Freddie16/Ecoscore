import express from 'express';
import {
  getFunds, getFund, applyToFund,
  getApplications, getApplication,
  withdrawApplication, getDashboardSummary,
} from '../controllers/marketplaceController.js';
import { protect, validate } from '../middleware/auth.js';
import { fundIdValidator, paginationValidator } from '../validators/index.js';

const router = express.Router();
router.use(protect);

// Funds
router.get('/funds',     getFunds);
router.get('/funds/:id', getFund);

// Applications
router.get('/dashboard-summary',          getDashboardSummary);
router.get('/applications',               ...paginationValidator, validate, getApplications);
router.get('/applications/:id',           getApplication);
router.post('/apply/:fundId',             ...fundIdValidator, validate, applyToFund);
router.patch('/applications/:id/withdraw', withdrawApplication);

export default router;