import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { validateRequest } from '@/middleware/validation';
import { authSchemas } from '@/schemas/auth';
import { authenticateToken } from '@/middleware/auth';

const router = Router();
const authController = new AuthController();

// Google authentication route
router.post('/google', validateRequest(authSchemas.googleAuth), authController.googleAuth);

// Profile route (protected)
router.get('/profile', authenticateToken, authController.getProfile);

export default router; 