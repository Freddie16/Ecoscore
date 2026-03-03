export interface User {
  id?: string;
  _id?: string;
  businessName: string;
  email: string;
  isAuthenticated: boolean;
  tier: 'Free' | 'Pro' | 'Enterprise';
  subscriptionStatus: 'none' | 'trialing' | 'active' | 'expired';
  trialEndDate?: string;
  paymentMethod?: 'mpesa' | 'paypal';
  ecoScore?: number;
  carbonCreditsBalance?: number;
}

export interface CarbonCredit {
  id?: string;
  _id?: string;
  project: string;
  standard: 'Verra' | 'Gold Standard' | 'EcoScore-V';
  volume: number;
  valuePerUnit: number;
  status: 'Pending' | 'Verified' | 'Sold' | 'Listed';
}

export interface ESGData {
  carbonFootprint: number;
  socialScore: number;
  governanceScore: number;
  ecoScore: number;
  lastUpdated: string;
}

export interface AnalysisResult {
  category: 'Environmental' | 'Social' | 'Governance';
  score: number;
  recommendations: string[];
  findings: string;
}

export interface GreenFund {
  id?: string;
  _id?: string;
  name: string;
  provider: string;
  maxFunding: string;
  interestRate: string;
  minEcoScore: number;
  description: string;
  category?: 'Loan' | 'Grant' | 'Equity' | 'Blended';
}

export interface Supplier {
  id?: string;
  _id?: string;
  name: string;
  category: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  impact: number;
  questionnaireStatus: 'Sent' | 'Pending' | 'Completed' | 'Not Started';
  lastResponseDate?: string;
  email: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    user: User;
  };
}