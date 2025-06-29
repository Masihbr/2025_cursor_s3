import express from 'express';
import passport from 'passport';
import { generateToken } from '../utils/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token for the authenticated user
    const user = req.user as any;
    const token = generateToken({
      userId: user._id,
      email: user.email
    });

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    const newToken = generateToken({
      userId: user._id,
      email: user.email
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Validate token
router.get('/validate', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        isActive: req.user.isActive
      }
    }
  });
});

// Get user by ID (for internal use)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

export default router; 