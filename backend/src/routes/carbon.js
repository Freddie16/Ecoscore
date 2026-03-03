import express from 'express';
import {
  getCredits, getCredit, createCredit, updateCredit, deleteCredit,
  verifyCredit, listCredit, sellCredit, valuateCredit,
} from '../controllers/carbonController.js';
import { protect, validate } from '../middleware/auth.js';
import { createCarbonCreditValidator } from '../validators/index.js';

const router = express.Router();
router.use(protect);

router.get('/',    getCredits);
router.post('/',   ...createCarbonCreditValidator, validate, createCredit);

router.get('/:id',    getCredit);
router.patch('/:id',  updateCredit);
router.delete('/:id', deleteCredit);

// Status transitions (each is a separate explicit action)
router.patch('/:id/verify',   verifyCredit);
router.patch('/:id/list',     listCredit);
router.patch('/:id/sell',     sellCredit);
router.post('/:id/valuate',   valuateCredit);

export default router;