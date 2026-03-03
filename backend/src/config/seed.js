import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import GreenFund from '../models/GreenFund.js';
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';
import CarbonCredit from '../models/CarbonCredit.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecoscore';

const funds = [
  {
    name: 'Green SME Loan',
    provider: 'Equity Bank Kenya',
    maxFunding: 'KES 25,000,000',
    maxFundingValue: 25000000,
    interestRate: '8.5% p.a.',
    minEcoScore: 75,
    description: 'Preferred lending rates for SMEs with verified low carbon footprints and active waste management systems.',
    category: 'Loan',
    tags: ['environmental', 'carbon', 'sme'],
  },
  {
    name: 'Gender Parity Grant',
    provider: 'Mastercard Foundation',
    maxFunding: 'KES 5,000,000',
    maxFundingValue: 5000000,
    interestRate: '0% (Grant)',
    minEcoScore: 80,
    description: 'Specifically targeting businesses with over 60% female workforce and equitable pay structures.',
    category: 'Grant',
    tags: ['social', 'gender', 'diversity'],
  },
  {
    name: 'Climate Resilience Fund',
    provider: 'Kenya Climate Ventures',
    maxFunding: 'KES 100,000,000',
    maxFundingValue: 100000000,
    interestRate: '12% p.a.',
    minEcoScore: 65,
    description: 'Growth capital for SMEs adapting their supply chains to climate-related disruptions in agriculture and manufacturing.',
    category: 'Loan',
    tags: ['climate', 'supply-chain', 'resilience'],
  },
  {
    name: 'Sustainable Agriculture Loan',
    provider: 'KCB Bank Kenya',
    maxFunding: 'KES 10,000,000',
    maxFundingValue: 10000000,
    interestRate: '10% p.a.',
    minEcoScore: 60,
    description: 'Financing for agri-SMEs adopting sustainable farming practices, organic certification, and climate-smart inputs.',
    category: 'Loan',
    tags: ['agriculture', 'sustainability'],
  },
  {
    name: 'AfDB Green Growth Grant',
    provider: 'African Development Bank',
    maxFunding: 'KES 50,000,000',
    maxFundingValue: 50000000,
    interestRate: '0% (Grant)',
    minEcoScore: 85,
    description: 'Pan-African grant program for businesses demonstrating measurable environmental and social impact at scale.',
    category: 'Grant',
    tags: ['pan-african', 'impact', 'scale'],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Seed green funds
    await GreenFund.deleteMany({});
    const createdFunds = await GreenFund.insertMany(funds);
    console.log(`✅ Seeded ${createdFunds.length} green funds`);

    // Create demo user
    let demoUser = await User.findOne({ email: 'demo@ecoscore.ai' });
    if (!demoUser) {
      demoUser = await User.create({
        businessName: 'Kipchoge Logistics Ltd',
        email: 'demo@ecoscore.ai',
        password: 'demo1234',
        tier: 'Pro',
        subscriptionStatus: 'trialing',
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ecoScore: 82,
      });
      console.log('✅ Created demo user (demo@ecoscore.ai / demo1234)');
    }

    // Seed demo suppliers
    await Supplier.deleteMany({ userId: demoUser._id });
    await Supplier.insertMany([
      { userId: demoUser._id, name: 'Nairobi Couriers', category: 'Logistics', riskLevel: 'High', impact: 24.5, questionnaireStatus: 'Completed', lastResponseDate: new Date('2024-03-10'), email: 'logistics@nairobi.com' },
      { userId: demoUser._id, name: 'Kitui Farmers Coop', category: 'Raw Materials', riskLevel: 'Low', impact: 4.2, questionnaireStatus: 'Completed', lastResponseDate: new Date('2024-03-12'), email: 'info@kituifarmers.org' },
      { userId: demoUser._id, name: 'Eldoret Packaging', category: 'Manufacturing', riskLevel: 'Medium', impact: 12.8, questionnaireStatus: 'Pending', email: 'sales@eldoretpack.co.ke' },
      { userId: demoUser._id, name: 'Mombasa Port Services', category: 'Logistics', riskLevel: 'High', impact: 18.2, questionnaireStatus: 'Sent', email: 'admin@mombasaport.com' },
    ]);
    console.log('✅ Seeded demo suppliers');

    // Seed demo carbon credits
    await CarbonCredit.deleteMany({ userId: demoUser._id });
    await CarbonCredit.insertMany([
      { userId: demoUser._id, project: 'Solar Transition 2024', standard: 'Gold Standard', volume: 45.2, valuePerUnit: 2500, status: 'Verified' },
      { userId: demoUser._id, project: 'Waste-to-Energy Initiative', standard: 'Verra', volume: 12.8, valuePerUnit: 2100, status: 'Pending' },
      { userId: demoUser._id, project: 'Supply Chain Optimization', standard: 'EcoScore-V', volume: 8.4, valuePerUnit: 1800, status: 'Sold', soldAt: new Date() },
    ]);
    console.log('✅ Seeded demo carbon credits');

    console.log('\n🌿 Seed complete!');
    console.log('   Demo login: demo@ecoscore.ai / demo1234');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();