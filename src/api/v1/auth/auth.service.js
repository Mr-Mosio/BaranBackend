import prisma from '../../../services/prisma.service';
import jwtService from '../../../services/jwt.service';
import config from '../../../config';
import bcrypt from 'bcrypt';

/**
 * Hashes a plain text password.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} - The hashed password.
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password with a hashed password.
 * @param {string} plainPassword - The plain text password.
 * @param {string} hashedPassword - The hashed password.
 * @returns {Promise<boolean>} - True if passwords match, false otherwise.
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generates a random numeric code of a specified length.
 * @param {number} length - The desired length of the code.
 * @returns {string} - The generated numeric code.
 */
const generateNumericCode = (length) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

/**
 * Generates and saves an OTP for a given mobile number.
 * If an unexpired OTP already exists, it will not create a new one.
 * @param {string} mobile - The mobile number to generate OTP for.
 * @returns {Promise<void>}
 */
const generateAndSaveOtp = async (mobile) => {
  const existingOtp = await prisma.otp.findFirst({
    where: {
      mobile,
      expires_at: {
        gt: new Date(),
      },
    },
  });

  if (existingOtp) {
    // Do not create a new OTP if an unexpired one already exists
    return;
  }

  const code = generateNumericCode(config.otp.codeLength);
  const expires_at = new Date(Date.now() + config.otp.expiresInMinutes * 60 * 1000);

  await prisma.otp.create({
    data: {
      mobile,
      code,
      expires_at,
    },
  });

  // TODO: Send OTP via SMS (integration with SMS provider)
};

/**
 * Handles the first step of authentication: checking mobile number and password existence, or initiating OTP.
 * @param {string} mobile - The user's mobile number.
 * @param {boolean} [force_otp=false] - Whether to force OTP sending even if a password exists.
 * @returns {Promise<{ has_password: boolean, otp_sent: boolean }>} - Indicates if the entity has a password and if OTP was sent.
 */
const checkMobile = async (mobile, force_otp = false) => {
  const entity = await prisma.entity.findUnique({
    where: { mobile },
  });

  if (!entity) {
    // User does not exist, send OTP for registration
    await generateAndSaveOtp(mobile);
    return { has_password: false, otp_sent: true };
  }

  const has_password = !!entity.password;

  if (!has_password || force_otp) {
    // If no password, or force_otp is true, initiate OTP process
    await generateAndSaveOtp(mobile);
    return { has_password, otp_sent: true };
  }

  return { has_password, otp_sent: false };
};

/**
 * Handles the second step of authentication: verifying OTP or password and logging in/registering.
 * @param {string} mobile - The user's mobile number.
 * @param {string} [password] - The user's password (if verifying with password).
 * @param {string} [code] - The OTP code entered by the user (if verifying with OTP).
 * @returns {Promise<{ token: string, user: object }>} - The generated JWT token and user data.
 * @throws {Error} - If verification fails.
 */
const verify = async (mobile, password, code) => {
  let entity;

  if (password) {
    entity = await prisma.entity.findUnique({
      where: { mobile },
    });

    if (!entity || !entity.password) {
      throw new Error('Invalid credentials');
    }
    const isPasswordValid = await comparePassword(password, entity.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
  } else if (code) {
    const otp = await prisma.otp.findFirst({
      where: {
        mobile,
        code,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!otp) {
      throw new Error('Invalid or expired OTP');
    }

    await prisma.otp.delete({
      where: { id: otp.id },
    });

    entity = await prisma.entity.findUnique({
      where: { mobile },
    });

    if (!entity) {
      entity = await prisma.entity.create({
        data: {
          mobile,
        },
      });
    }
  } else {
    throw new Error('Either password or OTP code is required for verification.');
  }

  if (!entity) {
    throw new Error('User not found after verification.');
  }

  const token = jwtService.generateToken({ id: entity.id, mobile: entity.mobile });

  return { token, user: entity };
};

export default {
  checkMobile,
  verify,
  generateAndSaveOtp,
  hashPassword,
  comparePassword,
};
