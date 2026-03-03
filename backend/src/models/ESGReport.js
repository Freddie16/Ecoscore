import mongoose from 'mongoose';

const analysisResultSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Environmental', 'Social', 'Governance'],
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  findings: String,
  recommendations: [String],
}, { _id: false });

const esgReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  results: [analysisResultSchema],
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  rawData: {
    type: String,
    select: false,
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

export default mongoose.model('ESGReport', esgReportSchema);