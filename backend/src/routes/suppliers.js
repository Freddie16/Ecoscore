import express from 'express';
import {
  getSuppliers, getSupplier, createSupplier, updateSupplier,
  deleteSupplier, getSupplierMetrics, assessSupplier,
  updateQuestionnaireStatus,
} from '../controllers/supplierController.js';
import { protect, validate } from '../middleware/auth.js';
import {
  createSupplierValidator, updateSupplierValidator, paginationValidator,
} from '../validators/index.js';

const router = express.Router();
router.use(protect);

// Metrics must be defined BEFORE /:id to avoid route collision
router.get('/metrics/summary', getSupplierMetrics);

router.get('/',    ...paginationValidator, validate, getSuppliers);
router.post('/',   ...createSupplierValidator, validate, createSupplier);

router.get('/:id',     getSupplier);
router.patch('/:id',   ...updateSupplierValidator, validate, updateSupplier);
router.delete('/:id',  deleteSupplier);

router.post('/:id/assess', assessSupplier);
router.patch('/:id/questionnaire', updateQuestionnaireStatus);

export default router;