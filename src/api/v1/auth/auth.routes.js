import express from 'express';
import authController from './auth.controller';
import { checkMobileValidator, verifyValidator } from './auth.validation';

const router = express.Router();

/**
 * @swagger
 * /auth/check-mobile:
 *   post:
 *     summary: Check mobile number existence.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *             properties:
 *               mobile:
 *                 type: string
 *                 description: User's mobile number.
 *                 example: "+989123456789"
 *               force_otp:
 *                 type: boolean
 *                 description: Whether to force OTP sending even if a password exists.
 *                 example: false
 *     responses:
 *       200:
 *         description: Mobile number checked successfully or OTP sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 has_password:
 *                   type: boolean
 *                   description: Indicates if the user has a password.
 *                 otp_sent:
 *                   type: boolean
 *                   description: Indicates if an OTP was sent.
 *       400:
 *         description: Invalid input.
 */
router.post('/check-mobile', checkMobileValidator, authController.checkMobile);

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify OTP or password for login/registration.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *             properties:
 *               mobile:
 *                 type: string
 *                 description: User's mobile number.
 *                 example: "+989123456789"
 *               otp:
 *                 type: string
 *                 description: One-Time Password received by the user (if verifying with OTP).
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 description: User's password (if verifying with password).
 *                 example: "StrongPassword123"
 *               confirm_password:
 *                 type: string
 *                 description: Confirmation of user's password (required if setting/changing password).
 *                 example: "StrongPassword123"
 *     responses:
 *       200:
 *         description: Verification successful, user logged in/registered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token.
 *                 user:
 *                   type: object
 *                   description: User data.
 *       400:
 *         description: Invalid input or verification failed.
 *       401:
 *         description: Unauthorized (e.g., invalid OTP or password).
 */
router.post('/verify', verifyValidator, authController.verify);

export default router;
