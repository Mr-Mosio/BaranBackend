import jwt from 'jsonwebtoken';
import config from '../config/index.js'; // Assuming config file exists for JWT secret

/**
 * @typedef {object} TokenPayload
 * @property {number} id - The entity ID.
 * @property {string} mobile - The entity's mobile number.
 * @property {number} [role_id] - The selected role ID (optional).
 */

/**
 * Generates a JWT token.
 * @param {TokenPayload} payload - The payload to include in the token.
 * @param {string} [expiresIn='1h'] - The token expiration time (e.g., '1h', '7d').
 * @returns {string} The generated JWT token.
 */
const generateToken = (payload, expiresIn = '1h') => {
  // TODO: Ensure JWT_SECRET is properly configured in environment variables
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {TokenPayload | null} The decoded payload if the token is valid, otherwise null.
 */
const verifyToken = (token) => {
  try {
    // TODO: Ensure JWT_SECRET is properly configured in environment variables
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
};
