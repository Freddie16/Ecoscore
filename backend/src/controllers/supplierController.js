import Supplier from '../models/Supplier.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendNoContent, buildPagination } from '../utils/apiResponse.js';
import { assessSupplierRisk } from '../services/geminiService.js';
import logger from '../utils/logger.js';

// ─── Risk weight constants ─────────────────────────────────────────────────
const RISK_WEIGHTS = { Low: 1, Medium: 2.5, High: 5 };

/** Attach a computed weightedRiskScore to a plain supplier object. */
const withWeightedScore = (s) => ({
  ...s,
  weightedRiskScore: parseFloat((s.impact * (RISK_WEIGHTS[s.riskLevel] ?? 1)).toFixed(2)),
});

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * GET /api/suppliers
 * List all suppliers for the authenticated user with optional pagination.
 */
export const getSuppliers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  // Optional filters
  const filter = { userId: req.user._id };
  if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.questionnaireStatus = req.query.status;

  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Supplier.countDocuments(filter),
  ]);

  sendSuccess(
    res,
    suppliers,
    '',
    200,
    buildPagination(page, limit, total)
  );
});

/**
 * GET /api/suppliers/:id
 * Fetch a single supplier by ID.
 */
export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!supplier) {
    throw new AppError('Supplier not found.', 404);
  }

  sendSuccess(res, withWeightedScore(supplier.toObject()));
});

/**
 * POST /api/suppliers
 * Create a new supplier and mark questionnaire as dispatched.
 */
export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create({
    ...req.body,
    userId: req.user._id,
    questionnaireStatus: 'Sent',
  });

  logger.info(`Supplier created: ${supplier.name} for user ${req.user._id}`);

  sendCreated(
    res,
    withWeightedScore(supplier.toObject()),
    `Supplier "${supplier.name}" added and questionnaire dispatched to ${supplier.email}`
  );
});

/**
 * PATCH /api/suppliers/:id
 * Partially update a supplier record.
 */
export const updateSupplier = asyncHandler(async (req, res) => {
  // Prevent userId from being overwritten
  delete req.body.userId;

  const supplier = await Supplier.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!supplier) {
    throw new AppError('Supplier not found.', 404);
  }

  sendSuccess(res, withWeightedScore(supplier.toObject()), 'Supplier updated successfully');
});

/**
 * DELETE /api/suppliers/:id
 * Remove a supplier record.
 */
export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!supplier) {
    throw new AppError('Supplier not found.', 404);
  }

  logger.info(`Supplier deleted: ${supplier.name}`);

  sendNoContent(res);
});

/**
 * GET /api/suppliers/metrics/summary
 * Aggregate risk metrics across all user suppliers.
 */
export const getSupplierMetrics = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ userId: req.user._id });

  const analyzed = suppliers.map((s) => withWeightedScore(s.toObject()));

  const totalImpact = parseFloat(
    analyzed.reduce((acc, s) => acc + s.impact, 0).toFixed(2)
  );

  const avgWeightedScore =
    analyzed.length > 0
      ? parseFloat(
          (analyzed.reduce((acc, s) => acc + s.weightedRiskScore, 0) / analyzed.length).toFixed(2)
        )
      : 0;

  const highRiskCount = analyzed.filter((s) => s.riskLevel === 'High').length;
  const mediumRiskCount = analyzed.filter((s) => s.riskLevel === 'Medium').length;
  const lowRiskCount = analyzed.filter((s) => s.riskLevel === 'Low').length;

  const pendingQuestionnaires = analyzed.filter(
    (s) => s.questionnaireStatus === 'Pending' || s.questionnaireStatus === 'Sent'
  ).length;

  // Top 5 highest-risk suppliers for immediate action
  const topRiskSuppliers = [...analyzed]
    .sort((a, b) => b.weightedRiskScore - a.weightedRiskScore)
    .slice(0, 5);

  const riskDistribution = [
    { name: 'Low', value: lowRiskCount, color: '#22c55e' },
    { name: 'Medium', value: mediumRiskCount, color: '#eab308' },
    { name: 'High', value: highRiskCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  sendSuccess(res, {
    suppliers: analyzed,
    summary: {
      totalSuppliers: suppliers.length,
      totalImpact,
      avgWeightedScore,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      pendingQuestionnaires,
    },
    topRiskSuppliers,
    riskDistribution,
  });
});

/**
 * POST /api/suppliers/:id/assess
 * Trigger an AI-powered risk narrative for a single supplier.
 */
export const assessSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!supplier) {
    throw new AppError('Supplier not found.', 404);
  }

  const narrative = await assessSupplierRisk(supplier.toObject(), req.user.businessName);

  sendSuccess(res, { narrative }, 'Risk assessment complete');
});

/**
 * PATCH /api/suppliers/:id/questionnaire
 * Update the questionnaire status for a supplier.
 */
export const updateQuestionnaireStatus = asyncHandler(async (req, res) => {
  const { status, lastResponseDate } = req.body;

  const validStatuses = ['Not Started', 'Sent', 'Pending', 'Completed'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const update = { questionnaireStatus: status };
  if (status === 'Completed') {
    update.lastResponseDate = lastResponseDate || new Date();
  }

  const supplier = await Supplier.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    update,
    { new: true }
  );

  if (!supplier) {
    throw new AppError('Supplier not found.', 404);
  }

  sendSuccess(res, withWeightedScore(supplier.toObject()), 'Questionnaire status updated');
});