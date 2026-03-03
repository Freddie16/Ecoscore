/**
 * Custom error class that extends the native Error.
 * Attaches an HTTP status code and a flag to distinguish
 * operational (expected) errors from programming bugs.
 *
 * Operational errors are safe to send to the client.
 * Programming errors should be hidden behind a generic 500.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx / 5xx)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace, excluding AppError constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;