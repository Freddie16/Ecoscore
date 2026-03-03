import ESGReport from '../models/ESGReport.js';
import CarbonCredit from '../models/CarbonCredit.js';
import Supplier from '../models/Supplier.js';
import FundApplication from '../models/FundApplication.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

// ─── Emission data helpers ─────────────────────────────────────────────────

/**
 * Build a 6-month rolling emission data array.
 * If the user has reports, derive from report scores;
 * otherwise return seeded placeholder data.
 */
const buildEmissionData = (reports) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (reports.length > 0) {
    // Map real reports onto months
    return reports.slice(0, 6).reverse().map((r, i) => ({
      month: months[new Date(r.createdAt).getMonth()],
      co2: parseFloat((100 - r.overallScore) * 0.2 + Math.random() * 2).toFixed(1),
    }));
  }

  // Fallback: descending trend (shows improvement over time)
  return [
    { month: 'Jan', co2: 12.5 },
    { month: 'Feb', co2: 11.8 },
    { month: 'Mar', co2: 14.2 },
    { month: 'Apr', co2: 10.5 },
    { month: 'May', co2: 9.8 },
    { month: 'Jun', co2: 8.4 },
  ];
};

/**
 * Build the ESG radar chart distribution from the latest report,
 * or derive proportional defaults from the user's current EcoScore.
 */
const buildEsgDistribution = (latestReport, ecoScore) => {
  if (latestReport?.results?.length > 0) {
    const cats = ['Environmental', 'Social', 'Governance'];
    const extras = ['Community', 'Supply Chain'];

    const reportMap = Object.fromEntries(
      latestReport.results.map((r) => [r.category, r.score])
    );

    return [
      ...cats.map((name) => ({ name, score: reportMap[name] ?? ecoScore })),
      { name: 'Community', score: Math.round(ecoScore * 0.82) },
      { name: 'Supply Chain', score: Math.round(ecoScore * 0.87) },
    ];
  }

  return [
    { name: 'Environmental', score: Math.round(ecoScore * 0.9) },
    { name: 'Social', score: Math.round(ecoScore * 1.05) },
    { name: 'Governance', score: Math.round(ecoScore * 1.1) },
    { name: 'Community', score: Math.round(ecoScore * 0.82) },
    { name: 'Supply Chain', score: Math.round(ecoScore * 0.87) },
  ];
};

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/stats
 * Single aggregated payload for the main dashboard.
 * Runs all DB queries in parallel for minimal latency.
 */
export const getStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const ecoScore = req.user.ecoScore ?? 0;

  const [credits, suppliers, applications, recentReports] = await Promise.all([
    CarbonCredit.find({ userId }),
    Supplier.find({ userId }),
    FundApplication.find({ userId, status: 'active' }),
    ESGReport.find({ userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('overallScore results createdAt'),
  ]);

  // ── Carbon metrics ──
  const carbonBalance = credits
    .filter((c) => c.status !== 'Sold')
    .reduce((acc, c) => acc + c.volume * c.valuePerUnit, 0);

  const carbonRevenue = credits
    .filter((c) => c.status === 'Sold')
    .reduce((acc, c) => acc + c.volume * c.valuePerUnit, 0);

  // ── Supplier / Scope 3 metrics ──
  const carbonFootprint = parseFloat(
    suppliers.reduce((acc, s) => acc + s.impact, 0).toFixed(2)
  );
  const highRiskSuppliers = suppliers.filter((s) => s.riskLevel === 'High').length;

  // ── KPI stats ──
  const socialParity = 88; // Would be computed from payroll data in a real system
  const statutoryCompliance = 100;

  // ── Chart data ──
  const emissionData = buildEmissionData(recentReports);
  const esgDistribution = buildEsgDistribution(recentReports[0] ?? null, ecoScore);

  // ── Ledger (static until M-Pesa webhook integration) ──
  const ledger = [
    { type: 'Utility', desc: 'Kenya Power (KPLC)', status: 'Audited', impact: '-2.4kg', color: 'text-red-400' },
    { type: 'Fuel', desc: 'Rubis Energy', status: 'Pending', impact: '-5.1kg', color: 'text-yellow-400' },
    { type: 'Social', desc: 'Payroll Disbursement', status: 'Verified', impact: '+12pts', color: 'text-green-400' },
    { type: 'Supply', desc: 'Maina Hauliers Ltd', status: 'Scope 3', impact: '-1.2kg', color: 'text-red-400' },
  ];

  sendSuccess(res, {
    // Core metrics
    ecoScore,
    tier: req.user.tier,
    businessName: req.user.businessName,
    subscriptionStatus: req.user.subscriptionStatus,

    // Carbon
    carbonBalance,
    carbonRevenue,

    // Footprint
    carbonFootprint,
    highRiskSuppliers,

    // KPIs
    socialParity,
    statutoryCompliance,
    greenFundAccess: applications.length,

    // Charts
    emissionData,
    esgDistribution,

    // Ledger
    ledger,

    // Counts
    totalSuppliers: suppliers.length,
    totalReports: recentReports.length,
    totalCredits: credits.length,
  });
});