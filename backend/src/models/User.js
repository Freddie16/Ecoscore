import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  tier: {
    type: String,
    enum: ['Free', 'Pro', 'Enterprise'],
    default: 'Free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'trialing', 'active', 'expired'],
    default: 'none',
  },
  trialEndDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'paypal', null],
    default: null,
  },
  ecoScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  carbonCreditsBalance: {
    type: Number,
    default: 0,
  },
  passwordChangedAt: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Hash password before saving; also record when it changed
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Returns true if password was changed after the JWT was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedAt;
  }
  return false;
};

// Remove password from output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);