
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Always use process.env.API_KEY directly as per guidelines.
// Initializing inside functions to ensure we use the latest injected API key.

export const analyzeESGData = async (transactions: string): Promise<AnalysisResult[]> => {
  // Always use process.env.API_KEY directly and initialize right before making an API call.
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const prompt = `
    Analyze the following business transaction data and provide an ESG (Environmental, Social, Governance) assessment for a Kenyan SME.
    Transactions:
    ${transactions}

    Requirements:
    1. Environmental: Estimate CO2 emissions from utility/fuel spend.
    2. Social: Analyze payroll for gender balance and compliance.
    3. Governance: Assess statutory compliance indicators.
    
    Return a detailed JSON response.
  `;

  // Upgrading to gemini-3-pro-preview for complex reasoning tasks like ESG auditing.
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            score: { type: Type.NUMBER },
            findings: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["category", "score", "findings", "recommendations"]
        }
      }
    }
  });

  try {
    // The simplest way to get text is using the .text property.
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return [];
  }
};

export const getEcoAdvice = async (history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<string> => {
  // Always use process.env.API_KEY directly and initialize right before making an API call.
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  // Using gemini-3-flash-preview for simple text Q&A tasks.
  // Passing history directly as Content[] for correct conversation flow.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: history,
    config: {
      systemInstruction: "You are the EcoScore.AI Advisor. You help Kenyan SMEs improve their ESG scores to unlock green funding. Be specific about Kenyan context (KRA, CBK, local energy providers, M-Pesa). Keep advice concise and professional.",
    }
  });
  // The simplest way to get text is using the .text property.
  return response.text || "I'm having trouble connecting right now.";
};
