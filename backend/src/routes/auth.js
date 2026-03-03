import express from 'express';
import { body } from 'express-validator';
import {
  register, login, getMe, updateProfile,
  changePassword, upgradeTier, deactivateAccount,
} from '../controllers/authController.js';
import { protect, validate } from '../middleware/auth.js';
import {
  registerValidator, loginValidator,
  upgradeValidator, changePasswordValidator,
} from '../validators/index.js';

const router = express.Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.post('/register', ...registerValidator, validate, register);
router.post('/login',    ...loginValidator,    validate, login);

// ── Protected ─────────────────────────────────────────────────────────────────
router.use(protect);

router.get('/me', getMe);

router.patch(
  '/profile',
  [body('businessName').trim().notEmpty().isLength({ max: 100 })],
  validate,
  updateProfile
);

router.patch('/change-password', ...changePasswordValidator, validate, changePassword);
router.patch('/upgrade',         ...upgradeValidator,        validate, upgradeTier);
router.delete('/account',        deactivateAccount);

export default router;