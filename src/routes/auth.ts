import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { validateRequest } from '@/middleware/validation';
import { authSchemas } from '@/schemas/auth';

const router = Router();
const authController = new AuthController();

// Local authentication routes
router.post('/register', validateRequest(authSchemas.register), authController.register);
router.post('/login', validateRequest(authSchemas.login), authController.login);
router.post('/logout', authController.logout);

// Social authentication routes
router.post('/google', validateRequest(authSchemas.googleAuth), authController.googleAuth);
router.post('/facebook', validateRequest(authSchemas.facebookAuth), authController.facebookAuth);

// Password reset routes
router.post('/forgot-password', validateRequest(authSchemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validateRequest(authSchemas.resetPassword), authController.resetPassword);

// Profile routes
router.get('/profile', authController.getProfile);
router.put('/profile', validateRequest(authSchemas.updateProfile), authController.updateProfile);

export default router; 