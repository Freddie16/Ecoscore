import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Shape a User document into a safe public-facing object.
 * Never exposes the password hash or internal flags.
 */
const formatUser = (user) => ({
  id: user._id,
  businessName: user.businessName,
  email: user.email,
  tier: user.tier,
  subscriptionStatus: user.subscriptionStatus,
  trialEndDate: user.trialEndDate,
  paymentMethod: user.paymentMethod,
  ecoScore: user.ecoScore,
  carbonCreditsBalance: user.carbonCreditsBalance,
  isAuthenticated: true,
  createdAt: user.createdAt,
});

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Create a new user account with optional tier selection.
 */
export const register = asyncHandler(async (req, res) => {
    console.log('Register endpoint hit with body:', req.body);


  const { businessName, email, password, tier = 'Free' } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const isPaid = tier !== 'Free';
  const subscriptionStatus = isPaid ? 'trialing' : 'none';
  const trialEndDate = isPaid ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined;

  const user = await User.create({
    businessName,
    email,
    password,
    tier,
    subscriptionStatus,
    trialEndDate,
    ecoScore: Math.floor(Math.random() * 20) + 60,
  });

  const token = generateToken(user._id);

  logger.success(`New user registered: ${email} (${tier})`);

  sendCreated(res, { token, user: formatUser(user) }, 'Account created successfully');
});

/**
 * POST /api/auth/login
 * Authenticate with email + password, return JWT.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  const token = generateToken(user._id);

  logger.info(`User logged in: ${email}`);

  sendSuccess(res, { token, user: formatUser(user) }, 'Login successful');
});

/**
 * GET /api/auth/me
 * Return the authenticated user's profile.
 */
export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, formatUser(req.user));
});

/**
 * PATCH /api/auth/profile
 * Update non-sensitive profile fields (businessName only).
 * Email and password changes each have dedicated endpoints.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['businessName'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    throw new AppError('No updatable fields provided.', 400);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, formatUser(user), 'Profile updated successfully');
});

/**
 * PATCH /api/auth/change-password
 * Verify current password then set a new one.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.password = newPassword;
  await user.save(); // triggers the pre-save bcrypt hook

  const token = generateToken(user._id);

  logger.info(`Password changed for: ${user.email}`);

  sendSuccess(res, { token }, 'Password updated successfully');
});

/**
 * PATCH /api/auth/upgrade
 * Upgrade subscription tier.
 * In production this should only be triggered by a payment webhook,
 * not directly by the client.
 */
export const upgradeTier = asyncHandler(async (req, res) => {
  const { tier, paymentMethod } = req.body;

  const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { tier, subscriptionStatus: 'trialing', trialEndDate, paymentMethod },
    { new: true, runValidators: true }
  );

  logger.success(`User ${user.email} upgraded to ${tier}`);

  sendSuccess(res, formatUser(user), `Successfully upgraded to ${tier} plan`);
});

/**
 * DELETE /api/auth/account
 * Soft-delete: deactivate rather than hard-delete for compliance.
 */
export const deactivateAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  logger.warn(`Account deactivated: ${req.user.email}`);
  res.status(204).send();
});