import mongoose from 'mongoose';

const carbonCreditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  project: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
  },
  standard: {
    type: String,
    enum: ['Verra', 'Gold Standard', 'EcoScore-V'],
    required: true,
  },
  volume: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Volume in tCO2e',
  },
  valuePerUnit: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Value per unit in KES',
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Sold', 'Listed'],
    default: 'Pending',
  },
  listedAt: Date,
  soldAt: Date,
}, {
  timestamps: true,
});

carbonCreditSchema.virtual('totalValue').get(function () {
  return this.volume * this.valuePerUnit;
});

export default mongoose.model('CarbonCredit', carbonCreditSchema);