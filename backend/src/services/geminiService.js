import { GoogleGenAI, Type } from '@google/genai';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Returns a fresh GoogleGenAI client using the environment API key.
 * Initialised per-call so key rotation is always picked up.
 */
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError('Gemini API key is not configured on the server.', 503);
  }
  return new GoogleGenAI({ apiKey });
};

// ─── ESG Audit ────────────────────────────────────────────────────────────

/**
 * Run an AI-powered ESG audit against raw transaction / spend data.
 *
 * @param {string} transactions - Raw text of M-Pesa / utility statements
 * @param {Object} userContext - { businessName, ecoScore, tier }
 * @returns {Promise<Array>} Array of { category, score, findings, recommendations }
 */
export const runESGAudit = async (transactions, userContext = {}) => {
  const ai = getClient();

  const prompt = `
You are an expert ESG analyst specialising in Kenyan SMEs and East African business regulations.

Analyse the following business transaction / spend data for: "${userContext.businessName || 'a Kenyan SME'}".

TRANSACTION DATA:
${transactions}

ANALYSIS REQUIREMENTS:
1. ENVIRONMENTAL — Estimate CO2 emissions from utility, fuel, and logistics spend. Reference Kenya Power (KPLC) emission factors, Rubis Energy, TotalEnergies. Calculate approximate Scope 1 and Scope 2 footprint in tCO2e.
2. SOCIAL — Analyse payroll patterns for gender equity indicators, living wage compliance against Kenya's Wage Order, NHIF/NSSF statutory deductions presence, and staff training or CSR spend.
3. GOVERNANCE — Assess KRA PIN compliance signals, statutory payment regularity, board/management transparency indicators, and anti-corruption policy adherence under Kenya's Anti-Corruption and Economic Crimes Act.

SCORING CRITERIA (0-100):
- 80-100: Industry-leading, IFRS S2 ready
- 60-79: Progressing, minor gaps
- 40-59: Material gaps, action required
- 0-39: Critical non-compliance

For each category, provide:
- A precise score (0-100)
- Specific findings referencing the actual data provided
- 3-5 actionable, Kenyan-context-specific recommendations

Return ONLY valid JSON matching the schema — no markdown, no preamble.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                enum: ['Environmental', 'Social', 'Governance'],
              },
              score: { type: Type.NUMBER },
              findings: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['category', 'score', 'findings', 'recommendations'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new AppError('AI returned an empty analysis. Please try again.', 502);
    }

    return parsed;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Gemini ESG audit error:', err);
    throw new AppError(`AI analysis failed: ${err.message}`, 502);
  }
};

// ─── AI Advisor Chat ──────────────────────────────────────────────────────

/**
 * Run a conversational AI advisor session.
 *
 * @param {Array} history - Array of { role: 'user'|'model', parts: [{ text }] }
 * @param {Object} userContext - { businessName, ecoScore, tier }
 * @returns {Promise<string>} AI response text
 */
export const runAdvisorChat = async (history, userContext = {}) => {
  const ai = getClient();

  const systemInstruction = `
You are the EcoScore.AI Advisor — a senior ESG consultant specialising in Kenyan SME sustainability and green finance.

BUSINESS CONTEXT:
- Business: ${userContext.businessName || 'Kenyan SME'}
- Current EcoScore: ${userContext.ecoScore ?? 'Unknown'}/100
- Subscription Tier: ${userContext.tier || 'Free'}

YOUR MANDATE:
- Help this business improve their EcoScore to unlock green funding
- Be specific to Kenyan regulatory context:
  * CBK ESG Reporting Directives 2026
  * IFRS S1 and S2 Climate Disclosures
  * Kenya's National Climate Change Action Plan
  * KRA statutory compliance (PAYE, VAT, WHT)
  * NHIF and NSSF payroll obligations
  * NEMA environmental compliance
  * Kenya Power (KPLC) and Stima Smart tariff structures
  * M-Pesa, Equity Bank, KCB green finance products
  * NSE listed company ESG requirements
- Provide specific, actionable advice — not generic platitudes
- When referencing emission factors, use Kenya-specific values
- Reference local green funds: Equity Bank Green SME Loan, Mastercard Foundation grants, Kenya Climate Ventures
- Keep responses concise (3-5 paragraphs max) and professional
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: history,
      config: { systemInstruction },
    });

    return response.text || "I'm having trouble connecting right now. Please try again.";
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Gemini chat error:', err);
    throw new AppError(`AI chat failed: ${err.message}`, 502);
  }
};

// ─── Supply Chain Risk Assessment ─────────────────────────────────────────

/**
 * Generate an AI-powered risk narrative for a single supplier.
 *
 * @param {Object} supplier - Supplier document
 * @param {string} businessName - Parent company name
 * @returns {Promise<string>} Risk narrative text
 */
export const assessSupplierRisk = async (supplier, businessName) => {
  const ai = getClient();

  const prompt = `
You are a Scope 3 supply chain risk analyst for a Kenyan business.

Assess the ESG risk profile of this supplier for "${businessName}":
- Supplier: ${supplier.name}
- Category: ${supplier.category}
- Current Risk Level: ${supplier.riskLevel}
- Carbon Impact: ${supplier.impact} tCO2e
- Questionnaire Status: ${supplier.questionnaireStatus}

Provide a concise (2-3 sentence) risk narrative covering:
1. The nature of the supply chain risk
2. Specific Kenyan regulatory or market considerations
3. One immediate mitigation action

Return ONLY a plain text paragraph — no bullet points, no headers, no JSON.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response.text?.trim() || 'Risk assessment unavailable.';
  } catch (err) {
    logger.error('Supplier risk assessment error:', err);
    return 'Risk assessment temporarily unavailable.';
  }
};

// ─── Carbon Credit Valuation ──────────────────────────────────────────────

/**
 * Estimate fair market value for a carbon credit project.
 *
 * @param {Object} credit - { project, standard, volume }
 * @returns {Promise<Object>} { estimatedValuePerUnit, rationale }
 */
export const valuateCarbonCredit = async (credit) => {
  const ai = getClient();

  const prompt = `
You are a carbon market analyst with expertise in East African voluntary carbon markets.

Provide a fair market valuation for:
- Project: ${credit.project}
- Standard: ${credit.standard}
- Volume: ${credit.volume} tCO2e

Return JSON with:
- estimatedValuePerUnit: number (KES per tCO2e)
- rationale: string (2-3 sentences explaining the valuation)
- marketComparison: string (comparison to similar East African projects)

Base the valuation on current voluntary carbon market conditions (2024-2025), ${credit.standard} premium, and Kenyan market liquidity.
Return ONLY valid JSON — no markdown.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    logger.error('Carbon valuation error:', err);
    return {
      estimatedValuePerUnit: null,
      rationale: 'Valuation service temporarily unavailable.',
      marketComparison: '',
    };
  }
};