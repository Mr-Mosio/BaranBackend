import authService from './auth.service.js';
import i18n from '../../../utils/i18n.js';

/**
 * Controller for the first step of authentication (check mobile and password).
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const checkMobile = async (req, res) => {
  const { mobile, force_otp } = req.body;

  try {
    const result = await authService.checkMobile(mobile, force_otp);
    if (result.otp_sent) {
      res.success(i18n.t('auth.otp_sent'), { has_password: result.has_password, otp_sent: true });
    } else {
      res.success(i18n.t('auth.mobile_checked'), { has_password: result.has_password, otp_sent: false });
    }
  } catch (error) {
    res.failed(error.message, error, 400);
  }
};

/**
 * Controller for the second step of authentication (verify OTP or password and login/register).
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const verify = async (req, res) => {
  const { mobile, password, code, role_id } = req.body;

  try {
    const result = await authService.verify(mobile, password, code, role_id);
    if (result.roles) {
      res.success(i18n.t('auth.multiple_roles_found'), result);
    } else {
      res.success(i18n.t('auth.verification_successful'), result);
    }
  } catch (error) {
    res.failed(error.message, error, 401);
  }
};

/**
 * Controller to get the authenticated user's profile.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const me = async (req, res) => {
  try {
    const user = await authService.getAuthenticatedUser(req.user.id);
    res.success(i18n.t('auth.user_profile_retrieved'), user);
  } catch (error) {
    res.failed(error.message, error, 404);
  }
};

export default {
  checkMobile,
  verify,
  me,
};
