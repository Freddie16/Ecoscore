import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Verifies the Bearer JWT, loads the user from DB, and attaches
 * it to req.user. Throws AppError on any auth failure so the global
 * error handler produces the right response shape.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('No token provided — please log in', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new AppError('Your session has expired — please log in again', 401);
    throw new AppError('Invalid token — please log in again', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('The account belonging to this token no longer exists', 401);
  if (!user.isActive) throw new AppError('This account has been deactivated', 403);

  if (user.changedPasswordAfter(decoded.iat)) {
    throw new AppError('Password was recently changed — please log in again', 401);
  }

  req.user = user;
  next();
});

/**
 * Restricts access to certain subscription tiers.
 * Usage: router.use(requireTier('Pro', 'Enterprise'))
 */
export const requireTier = (...tiers) =>
  asyncHandler(async (req, res, next) => {
    if (!tiers.includes(req.user.tier)) {
      throw new AppError(
        `This feature requires a ${tiers.join(' or ')} subscription`,
        403
      );
    }
    next();
  });

export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_change_me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Checks express-validator results and throws a 400 AppError
 * if any validation rule failed. Must be placed AFTER validator arrays.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join('. ');
    return next(new AppError(message, 400));
  }
  next();
};

/**
 * Guard that requires an active or trialing subscription.
 */
export const requireActiveSubscription = asyncHandler(async (req, res, next) => {
  const { subscriptionStatus } = req.user;
  if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
    throw new AppError('An active subscription is required to access this feature.', 403);
  }
  next();
});