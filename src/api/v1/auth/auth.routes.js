import express from 'express';
import authController from './auth.controller.js';
import { checkMobileValidator, verifyValidator } from './auth.validation.js';

const router = express.Router();

router.post('/check-mobile', checkMobileValidator, authController.checkMobile);
router.post('/verify', verifyValidator, authController.verify);

export default router;
