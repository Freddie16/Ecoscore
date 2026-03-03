import express from 'express';
import {
  runAudit, getReports, getReport, deleteReport,
  getLatestReport, getScoreTrend, advisorChat,
} from '../controllers/analysisController.js';
import { protect, validate } from '../middleware/auth.js';
import { auditValidator, chatValidator, paginationValidator } from '../validators/index.js';

const router = express.Router();
router.use(protect);

// Reports
router.get('/reports/latest', getLatestReport);
router.get('/reports/trend',  getScoreTrend);
router.get('/reports',        ...paginationValidator, validate, getReports);
router.get('/reports/:id',    getReport);
router.delete('/reports/:id', deleteReport);

// AI operations
router.post('/audit', ...auditValidator, validate, runAudit);
router.post('/chat',  ...chatValidator,  validate, advisorChat);

export default router;