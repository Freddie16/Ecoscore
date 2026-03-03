/**
 * Wraps an async route handler and forwards any thrown errors
 * to Express's next() so the global error handler processes them.
 * Eliminates repetitive try/catch blocks in every controller.
 *
 * @param {Function} fn - async controller function (req, res, next)
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;