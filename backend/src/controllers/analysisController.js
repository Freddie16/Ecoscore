import ESGReport from '../models/ESGReport.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendNoContent, buildPagination } from '../utils/apiResponse.js';
import { runESGAudit, runAdvisorChat } from '../services/geminiService.js';
import logger from '../utils/logger.js';

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * POST /api/analysis/audit
 * Run a Gemini-powered ESG audit against raw transaction / spend data.
 * Persists the report and updates the user's live EcoScore.
 */
export const runAudit = asyncHandler(async (req, res) => {
  const { transactions } = req.body;

  logger.info(`ESG audit started for user ${req.user._id}`);

  // Delegate AI work to the service layer
  const results = await runESGAudit(transactions, {
    businessName: req.user.businessName,
    ecoScore: req.user.ecoScore,
    tier: req.user.tier,
  });

  // Compute overall score as a weighted average
  const overallScore = Math.round(
    results.reduce((acc, r) => acc + r.score, 0) / results.length
  );

  // Persist report
  const report = await ESGReport.create({
    userId: req.user._id,
    results,
    overallScore,
    rawData: transactions,
    status: 'completed',
  });

  // Update user's live EcoScore
  await User.findByIdAndUpdate(req.user._id, { ecoScore: overallScore });

  logger.success(`ESG audit complete. Score: ${overallScore} for user ${req.user._id}`);

  sendCreated(res, {
    id: report._id,
    results,
    overallScore,
    createdAt: report.createdAt,
  }, 'ESG audit completed successfully');
});

/**
 * GET /api/analysis/reports
 * Paginated list of the user's past audit reports (rawData excluded).
 */
export const getReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    ESGReport.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-rawData'),
    ESGReport.countDocuments({ userId: req.user._id }),
  ]);

  sendSuccess(res, reports, '', 200, buildPagination(page, limit, total));
});

/**
 * GET /api/analysis/reports/:id
 * Fetch a single report. rawData is included here for export use-cases.
 */
export const getReport = asyncHandler(async (req, res) => {
  const report = await ESGReport.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  sendSuccess(res, report);
});

/**
 * DELETE /api/analysis/reports/:id
 * Remove a single audit report.
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await ESGReport.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  sendNoContent(res);
});

/**
 * GET /api/analysis/reports/latest
 * Shortcut to get the most recent audit report.
 */
export const getLatestReport = asyncHandler(async (req, res) => {
  const report = await ESGReport.findOne({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('-rawData');

  if (!report) {
    throw new AppError('No reports found. Run your first ESG audit to get started.', 404);
  }

  sendSuccess(res, report);
});

/**
 * GET /api/analysis/trend
 * Returns score trend data — overallScore per report for charting.
 */
export const getScoreTrend = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 12;

  const reports = await ESGReport.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('overallScore results createdAt');

  // Reverse so oldest-first for chart display
  const trend = reports.reverse().map((r) => ({
    date: r.createdAt,
    overallScore: r.overallScore,
    environmental: r.results.find((c) => c.category === 'Environmental')?.score ?? null,
    social: r.results.find((c) => c.category === 'Social')?.score ?? null,
    governance: r.results.find((c) => c.category === 'Governance')?.score ?? null,
  }));

  sendSuccess(res, trend);
});

// ─── AI Advisor Chat ───────────────────────────────────────────────────────

/**
 * POST /api/analysis/chat
 * Streaming-compatible AI advisor session (non-streaming for now).
 * Passes full conversation history to Gemini for context continuity.
 */
export const advisorChat = asyncHandler(async (req, res) => {
  const { history } = req.body;

  const response = await runAdvisorChat(history, {
    businessName: req.user.businessName,
    ecoScore: req.user.ecoScore,
    tier: req.user.tier,
  });

  sendSuccess(res, { response });
});