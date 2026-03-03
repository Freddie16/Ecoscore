/**
 * Standardised API response helpers.
 * All responses follow the shape:
 *   { success, message?, data?, pagination? }
 */

/**
 * Send a successful response.
 * @param {Object} res - Express response object
 * @param {*} data - Payload to send
 * @param {string} [message] - Optional human-readable message
 * @param {number} [statusCode=200] - HTTP status code
 * @param {Object} [pagination] - Optional pagination metadata
 */
export const sendSuccess = (res, data, message = '', statusCode = 200, pagination = null) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
};

/**
 * Send a created (201) response.
 */
export const sendCreated = (res, data, message = 'Resource created') =>
  sendSuccess(res, data, message, 201);

/**
 * Send a no-content (204) response.
 */
export const sendNoContent = (res) => res.status(204).send();

/**
 * Build a pagination metadata object.
 * @param {number} page - Current page (1-based)
 * @param {number} limit - Items per page
 * @param {number} total - Total document count
 */
export const buildPagination = (page, limit, total) => ({
  page: parseInt(page, 10),
  limit: parseInt(limit, 10),
  total,
  pages: Math.ceil(total / limit),
});