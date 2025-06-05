/**
 * @file Response middleware to standardize API responses.
 * @module middlewares/response.middleware
 */

/**
 * Attaches success and failed methods to the response object for consistent API responses.
 * @function
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @returns {void}
 */
const responseMiddleware = (req, res, next) => {
  /**
   * Sends a standardized success response.
   * @param {string} message - A descriptive success message.
   * @param {Object} data - The data to be sent in the response.
   * @param {number} statusCode - The HTTP status code for the response.
   * @returns {Object} The Express response object.
   */
  res.success = (message, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      status: true,
      message,
      data,
    });
  };

  /**
   * Sends a standardized error response.
   * @param {string} message - A descriptive error message.
   * @param {Object} error - The error object or details.
   * @param {number} statusCode - The HTTP status code for the error.
   * @returns {Object} The Express response object.
   */
  res.failed = (message, error = {}, statusCode = 400) => {
    return res.status(statusCode).json({
      status: false,
      message,
      error,
    });
  };

  next();
};

export default responseMiddleware;
