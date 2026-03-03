import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Logistics', 'Manufacturing', 'Raw Materials', 'Services', 'Energy', 'Other'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  impact: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Carbon impact in tCO2e',
  },
  questionnaireStatus: {
    type: String,
    enum: ['Not Started', 'Sent', 'Pending', 'Completed'],
    default: 'Sent',
  },
  lastResponseDate: {
    type: Date,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Supplier', supplierSchema);