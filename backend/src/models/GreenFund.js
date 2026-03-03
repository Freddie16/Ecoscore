import mongoose from 'mongoose';

const greenFundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  provider: {
    type: String,
    required: true,
  },
  maxFunding: {
    type: String,
    required: true,
  },
  maxFundingValue: {
    type: Number,
    comment: 'Numeric value in KES for filtering',
  },
  interestRate: {
    type: String,
    required: true,
  },
  minEcoScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Loan', 'Grant', 'Equity', 'Blended'],
    default: 'Loan',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tags: [String],
}, {
  timestamps: true,
});

export default mongoose.model('GreenFund', greenFundSchema);