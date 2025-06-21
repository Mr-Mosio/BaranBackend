import { ForbiddenError } from '../utils/errors.js';

/**
 * Helper function to check if entry has a specific permission
 * @param {Object} entry - Entry object
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether entry has the permission
 */
const can = (entry, permission) => {
  return !!entry?.permissions?.[permission];
};

/**
 * Helper function to check if entry has a specific role
 * @param {Object} entry - Entry object
 * @param {string} role - Role to check
 * @returns {boolean} Whether entry has the role
 */
const hasRole = (entry, role) => {
  return entry?.role === role;
};

/**
 * Middleware to check if entry has required permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware function
 */
const havePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.entry) {
        throw new ForbiddenError('Entry not authenticated');
      }

      if (!can(req.entry, permission)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if entry has required role
 * @param {string} role - Required role
 * @returns {Function} Express middleware function
 */
const haveRole = (role) => {
  return (req, res, next) => {
    try {
      if (!req.entry) {
        throw new ForbiddenError('Entry not authenticated');
      }

      if (!hasRole(req.entry, role)) {
        throw new ForbiddenError('Insufficient role privileges');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  havePermission,
  haveRole
};