import { body, param, query } from 'express-validator';

// ─── Auth validators ──────────────────────────────────────────────────────

export const registerValidator = [
  body('businessName')
    .trim()
    .notEmpty().withMessage('Business name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Business name must be between 2 and 100 characters'),

  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('tier')
    .optional()
    .isIn(['Free', 'Pro', 'Enterprise']).withMessage('Tier must be Free, Pro or Enterprise'),
];

export const loginValidator = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const upgradeValidator = [
  body('tier')
    .isIn(['Pro', 'Enterprise']).withMessage('Upgrade tier must be Pro or Enterprise'),

  body('paymentMethod')
    .optional()
    .isIn(['mpesa', 'paypal']).withMessage('Payment method must be mpesa or paypal'),
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/\d/).withMessage('New password must contain at least one number'),
];

// ─── Supplier validators ──────────────────────────────────────────────────

export const createSupplierValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Supplier name is required')
    .isLength({ max: 100 }).withMessage('Supplier name must not exceed 100 characters'),

  body('category')
    .isIn(['Logistics', 'Manufacturing', 'Raw Materials', 'Services', 'Energy', 'Other'])
    .withMessage('Invalid category'),

  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('riskLevel')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Risk level must be Low, Medium or High'),

  body('impact')
    .optional()
    .isFloat({ min: 0 }).withMessage('Impact must be a positive number'),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
];

export const updateSupplierValidator = [
  body('name')
    .optional().trim()
    .isLength({ max: 100 }).withMessage('Supplier name must not exceed 100 characters'),

  body('category')
    .optional()
    .isIn(['Logistics', 'Manufacturing', 'Raw Materials', 'Services', 'Energy', 'Other'])
    .withMessage('Invalid category'),

  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('riskLevel')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Risk level must be Low, Medium or High'),

  body('impact')
    .optional()
    .isFloat({ min: 0 }).withMessage('Impact must be a positive number'),

  body('questionnaireStatus')
    .optional()
    .isIn(['Not Started', 'Sent', 'Pending', 'Completed'])
    .withMessage('Invalid questionnaire status'),
];

// ─── Analysis validators ──────────────────────────────────────────────────

export const auditValidator = [
  body('transactions')
    .notEmpty().withMessage('Transaction data is required')
    .isLength({ min: 10, max: 50000 }).withMessage('Transaction data must be between 10 and 50,000 characters'),
];

export const chatValidator = [
  body('history')
    .isArray({ min: 1 }).withMessage('Chat history must be a non-empty array'),

  body('history.*.role')
    .isIn(['user', 'model']).withMessage('Message role must be user or model'),

  body('history.*.parts')
    .isArray({ min: 1 }).withMessage('Message parts must be a non-empty array'),

  body('history.*.parts.*.text')
    .isString().notEmpty().withMessage('Message text must be a non-empty string'),
];

// ─── Carbon credit validators ─────────────────────────────────────────────

export const createCarbonCreditValidator = [
  body('project')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ max: 200 }).withMessage('Project name must not exceed 200 characters'),

  body('standard')
    .isIn(['Verra', 'Gold Standard', 'EcoScore-V']).withMessage('Invalid carbon standard'),

  body('volume')
    .isFloat({ min: 0.1 }).withMessage('Volume must be at least 0.1 tCO2e'),

  body('valuePerUnit')
    .isFloat({ min: 1 }).withMessage('Value per unit must be at least 1 KES'),
];

// ─── Marketplace validators ───────────────────────────────────────────────

export const fundIdValidator = [
  param('fundId')
    .isMongoId().withMessage('Invalid fund ID'),
];

// ─── Pagination / query validators ────────────────────────────────────────

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
];