import CarbonCredit from '../models/CarbonCredit.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse.js';
import { valuateCarbonCredit } from '../services/geminiService.js';
import logger from '../utils/logger.js';

// ─── Helpers ──────────────────────────────────────────────────────────────

const computeTotals = (credits) => {
  const activeCredits = credits.filter((c) => c.status !== 'Sold');
  const soldCredits = credits.filter((c) => c.status === 'Sold');

  return {
    totalValue: activeCredits.reduce((acc, c) => acc + c.volume * c.valuePerUnit, 0),
    totalSold: parseFloat(soldCredits.reduce((acc, c) => acc + c.volume, 0).toFixed(2)),
    totalRevenue: soldCredits.reduce((acc, c) => acc + c.volume * c.valuePerUnit, 0),
    verifiedCount: credits.filter((c) => c.status === 'Verified').length,
    pendingCount: credits.filter((c) => c.status === 'Pending').length,
    listedCount: credits.filter((c) => c.status === 'Listed').length,
  };
};

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * GET /api/carbon
 * List all carbon credits with aggregate financial totals.
 */
export const getCredits = asyncHandler(async (req, res) => {
  // Optional status filter
  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const credits = await CarbonCredit.find(filter).sort({ createdAt: -1 });
  const totals = computeTotals(credits);

  sendSuccess(res, { credits, ...totals });
});

/**
 * GET /api/carbon/:id
 * Fetch a single carbon credit record.
 */
export const getCredit = asyncHandler(async (req, res) => {
  const credit = await CarbonCredit.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!credit) {
    throw new AppError('Carbon credit not found.', 404);
  }

  sendSuccess(res, credit);
});

/**
 * POST /api/carbon
 * Register a new carbon credit project.
 */
export const createCredit = asyncHandler(async (req, res) => {
  const credit = await CarbonCredit.create({
    ...req.body,
    userId: req.user._id,
    status: 'Pending', // always starts as Pending until verified
  });

  logger.info(`Carbon credit created: "${credit.project}" (${credit.volume} tCO2e)`);

  sendCreated(res, credit, 'Carbon credit registered. Pending verification.');
});

/**
 * PATCH /api/carbon/:id
 * Update mutable fields on a carbon credit (project, standard, volume, valuePerUnit).
 * Cannot update status directly — use dedicated status endpoints.
 */
export const updateCredit = asyncHandler(async (req, res) => {
  // Block direct status manipulation — use /verify, /list, /sell endpoints
  delete req.body.status;
  delete req.body.userId;
  delete req.body.listedAt;
  delete req.body.soldAt;

  const credit = await CarbonCredit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!credit) {
    throw new AppError('Carbon credit not found.', 404);
  }

  sendSuccess(res, credit, 'Carbon credit updated');
});

/**
 * DELETE /api/carbon/:id
 * Remove a carbon credit (only allowed if status is Pending).
 */
export const deleteCredit = asyncHandler(async (req, res) => {
  const credit = await CarbonCredit.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!credit) {
    throw new AppError('Carbon credit not found.', 404);
  }

  if (credit.status !== 'Pending') {
    throw new AppError(
      `Cannot delete a credit with status "${credit.status}". Only Pending credits can be removed.`,
      400
    );
  }

  await credit.deleteOne();

  sendNoContent(res);
});

/**
 * PATCH /api/carbon/:id/verify
 * Mark a Pending credit as Verified (admin action in production;
 * demo allows self-verification).
 */
export const verifyCredit = asyncHandler(async (req, res) => {
  const credit = await CarbonCredit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, status: 'Pending' },
    { status: 'Verified' },
    { new: true }
  );

  if (!credit) {
    throw new AppError(
      'Credit not found or is not in Pending status. Only Pending credits can be verified.',
      404
    );
  }

  logger.info(`Carbon credit verified: "${credit.project}"`);

  sendSuccess(res, credit, 'Carbon credit verified successfully');
});

/**
 * PATCH /api/carbon/:id/list
 * List a Verified credit on the carbon market.
 */
export const listCredit = asyncHandler(async (req, res) => {
  const credit = await CarbonCredit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, status: 'Verified' },
    { status: 'Listed', listedAt: new Date() },
    { new: true }
  );

  if (!credit) {
    throw new AppError(
      'Credit not found or is not Verified. Only Verified credits can be listed.',
      404
    );
  }

  logger.info(`Carbon credit listed on market: "${credit.project}"`);

  sendSuccess(res, credit, 'Carbon credit listed on the market');
});

/**
 * PATCH /api/carbon/:id/sell
 * Record a sale — marks a Listed credit as Sold and sets soldAt timestamp.
 */
export const sellCredit = asyncHandler(async (req, res) => {
  const credit = await CarbonCredit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, status: 'Listed' },
    { status: 'Sold', soldAt: new Date() },
    { new: true }
  );

  if (!credit) {
    throw new AppError(
      'Credit not found or is not Listed. Only Listed credits can be marked as sold.',
      404
    );
  }

  logger.success(`Carbon credit sold: "${credit.project}" (${credit.volume} tCO2e)`);

  sendSuccess(res, credit, 'Carbon credit marked as sold');
});

/**
 * POST /api/carbon/:id/valuate
 * Get an AI-estimated fair market value for a credit.
 */
export const valuateCredit = asyncHandler(async (req, res) => {
  const credit = await CarbonCredit.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!credit) {
    throw new AppError('Carbon credit not found.', 404);
  }

  const valuation = await valuateCarbonCredit({
    project: credit.project,
    standard: credit.standard,
    volume: credit.volume,
  });

  sendSuccess(res, valuation, 'Valuation complete');
});