import { body } from 'express-validator';
import { validator, validateMobile, validatePassword } from '~/utils/validator';

/**
 * Validators for the /auth/check-mobile route.
 * Only mobile number is expected at this stage.
 */
export const checkMobileValidator = validator(
  body('mobile')
    .notEmpty().withMessage('Mobile number is required.')
    .custom(validateMobile),
  body('force_otp')
    .optional()
    .isBoolean().withMessage('Force OTP must be a boolean.')
    .toBoolean()
);

/**
 * Validators for the /auth/verify route.
 * Expects either OTP or password along with mobile number.
 */
export const verifyValidator = validator(
  body('mobile')
    .notEmpty().withMessage('Mobile number is required.')
    .custom(validateMobile),
  body('otp')
    .optional()
    .isNumeric().withMessage('OTP must be numeric.')
    .isLength({ min: 4, max: 6 }).withMessage('OTP must be between 4 and 6 digits.'),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body().custom((value, { req }) => {
    const { otp, password } = req.body;
    if (!otp && !password) {
      throw new Error('Either OTP or password is required.');
    }
    if (otp && password) {
      throw new Error('Cannot provide both OTP and password.');
    }
    return true;
  })
);
