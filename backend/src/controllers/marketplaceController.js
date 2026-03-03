import GreenFund from '../models/GreenFund.js';
import FundApplication from '../models/FundApplication.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, buildPagination } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// ─── Green Funds ──────────────────────────────────────────────────────────

/**
 * GET /api/marketplace/funds
 * List all active green funds, sorted by minimum EcoScore required.
 * Optionally filter by category or tag.
 */
export const getFunds = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.eligible === 'true') {
    filter.minEcoScore = { $lte: req.user.ecoScore };
  }

  const funds = await GreenFund.find(filter).sort({ minEcoScore: 1 });

  // Annotate each fund with the user's eligibility
  const annotated = funds.map((f) => ({
    ...f.toObject(),
    isEligible: req.user.ecoScore >= f.minEcoScore,
    scoreGap: Math.max(0, f.minEcoScore - req.user.ecoScore),
  }));

  sendSuccess(res, annotated);
});

/**
 * GET /api/marketplace/funds/:id
 * Fetch a single fund with full details.
 */
export const getFund = asyncHandler(async (req, res) => {
  const fund = await GreenFund.findOne({ _id: req.params.id, isActive: true });

  if (!fund) {
    throw new AppError('Fund not found.', 404);
  }

  sendSuccess(res, {
    ...fund.toObject(),
    isEligible: req.user.ecoScore >= fund.minEcoScore,
    scoreGap: Math.max(0, fund.minEcoScore - req.user.ecoScore),
  });
});

// ─── Applications ─────────────────────────────────────────────────────────

/**
 * POST /api/marketplace/apply/:fundId
 * Submit a new application for a green fund.
 * Checks EcoScore eligibility and prevents duplicate applications.
 */
export const applyToFund = asyncHandler(async (req, res) => {
  const fund = await GreenFund.findOne({ _id: req.params.fundId, isActive: true });

  if (!fund) {
    throw new AppError('Fund not found or no longer accepting applications.', 404);
  }

  // EcoScore gate
  if (req.user.ecoScore < fund.minEcoScore) {
    throw new AppError(
      `Your EcoScore of ${req.user.ecoScore} does not meet the minimum requirement of ${fund.minEcoScore} for this fund. ` +
        `You need ${fund.minEcoScore - req.user.ecoScore} more points. Run an ESG audit to improve your score.`,
      403
    );
  }

  // Duplicate application check
  const existing = await FundApplication.findOne({
    userId: req.user._id,
    fundId: fund._id,
    status: { $ne: 'rejected' }, // Allow re-applying after rejection
  });

  if (existing) {
    throw new AppError(
      `You have already applied to "${fund.name}". Current stage: ${existing.stage}.`,
      409
    );
  }

  const application = await FundApplication.create({
    userId: req.user._id,
    fundId: fund._id,
    fundName: fund.name,
    amount: fund.maxFunding,
    stage: 'Application Submitted',
    progress: 25,
    status: 'active',
    lastUpdated: new Date(),
  });

  logger.success(`Application submitted: ${req.user.businessName} → ${fund.name}`);

  const populated = await application.populate('fundId', 'name provider interestRate');

  sendCreated(
    res,
    populated,
    `Application for "${fund.name}" submitted successfully. We will review your EcoScore shortly.`
  );
});

/**
 * GET /api/marketplace/applications
 * Paginated list of the user's fund applications.
 */
export const getApplications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    FundApplication.find(filter)
      .populate('fundId', 'name provider interestRate maxFunding category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    FundApplication.countDocuments(filter),
  ]);

  sendSuccess(res, applications, '', 200, buildPagination(page, limit, total));
});

/**
 * GET /api/marketplace/applications/:id
 * Fetch a single application with full fund details.
 */
export const getApplication = asyncHandler(async (req, res) => {
  const application = await FundApplication.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate('fundId');

  if (!application) {
    throw new AppError('Application not found.', 404);
  }

  sendSuccess(res, application);
});

/**
 * PATCH /api/marketplace/applications/:id/withdraw
 * Withdraw an active application.
 */
export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await FundApplication.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user._id,
      status: 'active',
    },
    { status: 'rejected', stage: 'Rejected', progress: 0 },
    { new: true }
  );

  if (!application) {
    throw new AppError('Application not found or cannot be withdrawn.', 404);
  }

  logger.info(`Application withdrawn: ${application.fundName} by ${req.user._id}`);

  sendSuccess(res, application, 'Application withdrawn successfully');
});

/**
 * GET /api/marketplace/dashboard-summary
 * Lightweight summary for the dashboard pipeline widget.
 * Returns eligible fund count + latest 4 applications.
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [eligibleFunds, applications] = await Promise.all([
    GreenFund.countDocuments({
      isActive: true,
      minEcoScore: { $lte: req.user.ecoScore },
    }),
    FundApplication.find({ userId: req.user._id })
      .populate('fundId', 'name provider')
      .sort({ updatedAt: -1 })
      .limit(4),
  ]);

  sendSuccess(res, {
    eligibleFundsCount: eligibleFunds,
    applications,
  });
});