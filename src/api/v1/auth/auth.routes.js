import express from 'express';
import authController from './auth.controller.js';
import { checkMobileValidator, verifyValidator } from './auth.validation.js';
import authMiddleware from '../../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/check-mobile', checkMobileValidator, authController.checkMobile);
router.post('/verify', verifyValidator, authController.verify);
router.get('/me', authMiddleware.authenticate, authController.me);

export default router;
