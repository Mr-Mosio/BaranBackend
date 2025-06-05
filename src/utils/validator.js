import { validationResult, body, buildCheckFunction, matchedData, query } from 'express-validator';
import path from 'path';
import { promises as fs } from 'fs';
import { failedResponse } from '../middlewares/response.middleware'; // Assuming this path

/**
 * Validates a mobile number for Iranian format.
 * @param {string} value - The mobile number to validate.
 * @returns {string} The validated mobile number.
 * @throws {Error} If the mobile number is invalid.
 */
export function validateMobile(value) {
  if (!/^(\+98|0)?9\d{9}$/.test(value)) {
    throw new Error('Invalid mobile number.');
  }
  return value;
}

/**
 * Validates if the password matches the confirmation password.
 * @param {string} value - The password to validate.
 * @param {object} options - Options object containing the request.
 * @param {object} options.req - The Express request object.
 * @returns {string} The validated password.
 * @throws {Error} If the password and confirmation password do not match.
 */
export function validatePassword(value, { req }) {
  if (value && value !== req.body.confirm_password) {
    throw new Error('Password and confirmation do not match.');
  }
  return value;
}

/**
 * Creates a filter object for 'contains' queries.
 * @param {string} value - The value to search for.
 * @returns {object} An object with a 'contains' property.
 */
export function containsFilter(value) {
  return {
    contains: value
  };
}

/**
 * Removes the application URL from a media path.
 * @param {string} value - The media path.
 * @returns {string} The media path with the application URL removed.
 */
export function mediaSingle(value) {
  return value.replace(process.env.APP_URL, '');
}

/**
 * Custom validator/sanitizer for handling file uploads.
 * Attaches a `store` method to the file object for saving files.
 * @param {...any} args - Arguments passed to buildCheckFunction.
 * @returns {import("express-validator").CustomValidator} A custom validator function.
 */
export const files = (...args) => {
  return buildCheckFunction(['files'])(...args).customSanitizer((value) => {
    if (!value) {
      value = {};
    }
    /**
     * Stores the uploaded file to the specified path.
     * @param {string} uploadPath - The directory path where the file should be stored.
     * @param {string} [filename=''] - Optional base filename to use.
     * @param {string} [previous=null] - Optional path to a previous file to unlink.
     * @returns {Promise<string|null>} The stored file path or null if storage failed.
     */
    value.store = async (uploadPath, filename = '', previous = null) => {
      try {
        if (previous) {
          await fs.unlink(previous);
        }
        if (value.mv) {
          const name = new Date().getTime();
          const fileExtension = value.name.match(/\.[a-zA-Z0-9]+$/)?.[0] || '';
          const finalFilename = `${name}${filename}${fileExtension}`;
          const filePath = path.join(uploadPath, finalFilename);
          const absolutePath = path.resolve(filePath);

          await new Promise((resolve, reject) => {
            value.mv(absolutePath, (err) => {
              if (err) {
                return reject(err);
              }
              resolve();
            });
          });
          return filePath;
        }
        return null;
      } catch (error) {
        console.error('File storage error:', error);
        return null;
      }
    };
    return value;
  });
};

/**
 * Middleware to handle validation results and attach matched data to the request.
 * @param {...import("express-validator").ValidationChain} args - Express-validator validation chains.
 * @returns {Array<import("express").RequestHandler>} An array of middleware functions.
 */
export function validator(...args) {
  return [
    ...args,
    (req, res, next) => {
      const validate = validationResult(req);
      if (!validate.isEmpty()) {
        const errors = validate.array().map(err => err.msg);
        return res.failed(errors[0], validate.array(), 400); // Pass first error message, and all errors in data
      }
      req.data = matchedData(req);
      return next();
    }
  ];
}

/**
 * Middleware to handle filtering logic, including an optional _excel query parameter.
 * @param {Array<string>} [excel=null] - Array of allowed excel fields.
 * @param {...import("express-validator").ValidationChain} args - Express-validator validation chains.
 * @returns {Array<import("express").RequestHandler>} An array of middleware functions.
 */
export function filter(excel = null, ...args) {
  return [
    ...args,
    ...(excel ? [
      query('_excel').optional().customSanitizer(value => value.split(','))
    ] : []),
    (req, res, next) => {
      const validate = validationResult(req);
      if (!validate.isEmpty()) {
        return res.status(400).json(failedResponse(validate));
      }
      const { _excel, ...filters } = matchedData(req);
      if (_excel) {
        req.excel = excel.filter(e => !!_excel.find(x => e === x));
      }
      req.filters = filters;
      return next();
    }
  ];
}
