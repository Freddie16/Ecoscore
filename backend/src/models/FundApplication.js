import mongoose from 'mongoose';

const fundApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GreenFund',
    required: true,
  },
  fundName: String,
  amount: String,
  stage: {
    type: String,
    enum: ['Pre-qualified', 'Application Submitted', 'Under Review', 'Funded', 'Rejected'],
    default: 'Application Submitted',
  },
  progress: {
    type: Number,
    default: 25,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'rejected'],
    default: 'active',
  },
  notes: String,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('FundApplication', fundApplicationSchema);