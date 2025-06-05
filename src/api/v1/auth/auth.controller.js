import authService from './auth.service';

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
      res.success('OTP sent successfully.', { has_password: result.has_password, otp_sent: true });
    } else {
      res.success('Mobile number checked successfully.', { has_password: result.has_password, otp_sent: false });
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
  const { mobile, password, code } = req.body;

  try {
    const result = await authService.verify(mobile, password, code);
    res.success('Verification successful', result);
  } catch (error) {
    res.failed(error.message, error, 401);
  }
};

export default {
  checkMobile,
  verify,
};
