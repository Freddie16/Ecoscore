import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Current best free Groq model

/**
 * Core Groq API call — uses the OpenAI-compatible endpoint.
 */
const callGroq = async (messages, jsonMode = false) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError('Groq API key is not configured. Add GROQ_API_KEY to your .env file.', 503);
  }

  const body = {
    model: MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 2048,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Groq API error ${res.status}`;
    throw new AppError(`AI service error: ${msg}`, 502);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
};

// ─── ESG Audit ────────────────────────────────────────────────────────────

/**
 * Run an AI-powered ESG audit against raw transaction / spend data.
 *
 * @param {string} transactions - Raw text of M-Pesa / utility statements
 * @param {Object} userContext  - { businessName, ecoScore, tier }
 * @returns {Promise<Array>}    Array of { category, score, findings, recommendations }
 */
export const runESGAudit = async (transactions, userContext = {}) => {
  const messages = [
    {
      role: 'system',
      content: `You are an expert ESG analyst specialising in Kenyan SMEs and East African business regulations.
Your job is to analyse business data and return a JSON object with an "results" array.
You MUST return only valid JSON — no markdown, no explanation, no extra text.`,
    },
    {
      role: 'user',
      content: `Analyse the following business transaction/spend data for: "${userContext.businessName || 'a Kenyan SME'}".

TRANSACTION DATA:
${transactions}

ANALYSIS REQUIREMENTS:
1. ENVIRONMENTAL — Estimate CO2 emissions from utility, fuel, and logistics spend. Reference Kenya Power (KPLC) emission factors. Calculate approximate Scope 1 and Scope 2 footprint in tCO2e.
2. SOCIAL — Analyse payroll patterns for gender equity, living wage compliance against Kenya's Wage Order, NHIF/NSSF statutory deductions, and staff training spend.
3. GOVERNANCE — Assess KRA PIN compliance signals, statutory payment regularity, and anti-corruption policy adherence under Kenya's Anti-Corruption and Economic Crimes Act.

SCORING (0-100):
- 80-100: Industry-leading, IFRS S2 ready
- 60-79: Progressing, minor gaps
- 40-59: Material gaps, action required
- 0-39: Critical non-compliance

Return a JSON object in this EXACT format:
{
  "results": [
    {
      "category": "Environmental",
      "score": <number 0-100>,
      "findings": "<specific findings from the data>",
      "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"]
    },
    {
      "category": "Social",
      "score": <number 0-100>,
      "findings": "<specific findings from the data>",
      "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"]
    },
    {
      "category": "Governance",
      "score": <number 0-100>,
      "findings": "<specific findings from the data>",
      "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"]
    }
  ]
}`,
    },
  ];

  try {
    const text = await callGroq(messages, true);
    const parsed = JSON.parse(text);
    const results = parsed.results || parsed;

    if (!Array.isArray(results) || results.length === 0) {
      throw new AppError('AI returned an empty analysis. Please try again.', 502);
    }

    return results;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Groq ESG audit error:', err);
    throw new AppError(`AI analysis failed: ${err.message}`, 502);
  }
};

// ─── AI Advisor Chat ──────────────────────────────────────────────────────

/**
 * Run a conversational AI advisor session.
 *
 * @param {Array}  history     - Array of { role: 'user'|'model', parts: [{ text }] }
 * @param {Object} userContext - { businessName, ecoScore, tier }
 * @returns {Promise<string>}  AI response text
 */
export const runAdvisorChat = async (history, userContext = {}) => {
  // Convert from Gemini format { role, parts: [{ text }] } to OpenAI format { role, content }
  const messages = [
    {
      role: 'system',
      content: `You are the EcoScore.AI Advisor — a senior ESG consultant specialising in Kenyan SME sustainability and green finance.

BUSINESS CONTEXT:
- Business: ${userContext.businessName || 'Kenyan SME'}
- Current EcoScore: ${userContext.ecoScore ?? 'Unknown'}/100
- Subscription Tier: ${userContext.tier || 'Free'}

YOUR MANDATE:
- Help this business improve their EcoScore to unlock green funding
- Be specific to Kenyan regulatory context: CBK ESG Directives 2026, IFRS S1/S2, KRA compliance, NHIF/NSSF, NEMA
- Reference local green funds: Equity Bank Green SME Loan, Mastercard Foundation, Kenya Climate Ventures, KCB green products
- Keep responses concise (3-5 paragraphs max) and professional`,
    },
    ...history.map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts?.[0]?.text || msg.content || '',
    })),
  ];

  try {
    return await callGroq(messages, false);
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Groq chat error:', err);
    throw new AppError(`AI chat failed: ${err.message}`, 502);
  }
};

// ─── Supply Chain Risk Assessment ─────────────────────────────────────────

/**
 * Generate an AI-powered risk narrative for a single supplier.
 */
export const assessSupplierRisk = async (supplier, businessName) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a Scope 3 supply chain risk analyst for Kenyan businesses. Respond with only a plain text paragraph — no bullet points, no headers.',
    },
    {
      role: 'user',
      content: `Assess the ESG risk profile of this supplier for "${businessName}":
- Supplier: ${supplier.name}
- Category: ${supplier.category}
- Current Risk Level: ${supplier.riskLevel}
- Carbon Impact: ${supplier.impact} tCO2e
- Questionnaire Status: ${supplier.questionnaireStatus}

Provide a concise 2-3 sentence risk narrative covering: the nature of the risk, Kenyan regulatory considerations, and one immediate mitigation action.`,
    },
  ];

  try {
    const text = await callGroq(messages, false);
    return text.trim() || 'Risk assessment unavailable.';
  } catch (err) {
    logger.error('Supplier risk assessment error:', err);
    return 'Risk assessment temporarily unavailable.';
  }
};

// ─── Carbon Credit Valuation ──────────────────────────────────────────────

/**
 * Estimate fair market value for a carbon credit project.
 */
export const valuateCarbonCredit = async (credit) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a carbon market analyst specialising in East African voluntary carbon markets. Return only valid JSON — no markdown, no extra text.',
    },
    {
      role: 'user',
      content: `Provide a fair market valuation for:
- Project: ${credit.project}
- Standard: ${credit.standard}
- Volume: ${credit.volume} tCO2e

Return JSON: { "estimatedValuePerUnit": <number in KES>, "rationale": "<2-3 sentences>", "marketComparison": "<comparison to similar East African projects>" }`,
    },
  ];

  try {
    const text = await callGroq(messages, true);
    return JSON.parse(text);
  } catch (err) {
    logger.error('Carbon valuation error:', err);
    return {
      estimatedValuePerUnit: null,
      rationale: 'Valuation service temporarily unavailable.',
      marketComparison: '',
    };
  }
};