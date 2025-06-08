import { body } from 'express-validator';
import { validator, validateMobile } from '../../../utils/validator.js';
import i18n from '../../../utils/i18n.js';

/**
 * Validators for the /auth/check-mobile route.
 * Only mobile number is expected at this stage.
 */
export const checkMobileValidator = validator(
  body('mobile')
    .notEmpty().withMessage(i18n.t('auth.mobile_required'))
    .custom(validateMobile),
  body('force_otp')
    .optional()
    .isBoolean().withMessage(i18n.t('auth.force_otp_boolean'))
    .toBoolean()
);

/**
 * Validators for the /auth/verify route.
 * Expects either OTP or password along with mobile number.
 */
export const verifyValidator = validator(
  body('mobile')
    .notEmpty().withMessage(i18n.t('auth.mobile_required'))
    .custom(validateMobile),
  body('code')
    .optional()
    .isNumeric().withMessage(i18n.t('auth.otp_numeric'))
    .isLength({ min: 4, max: 6 }).withMessage(i18n.t('auth.otp_length')),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage(i18n.t('auth.password_length')),
  body().custom((value, { req }) => {
    const { code, password } = req.body;
    if (!code && !password) {
      throw new Error(i18n.t('auth.otp_or_password_required'));
    }
    if (code && password) {
      throw new Error(i18n.t('auth.cannot_provide_both_otp_and_password'));
    }
    return true;
  })
);
