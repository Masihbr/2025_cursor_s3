import { Request, Response } from 'express';
import { AuthUser } from '@/types';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/models/User';
import { appConfig } from '@/config/app';

const client = new OAuth2Client(appConfig.googleClientId);
const JWT_EXPIRES_IN = appConfig.jwtExpiresIn || '7d';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      error: 'Register endpoint not implemented yet'
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      error: 'Login endpoint not implemented yet'
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      error: 'Logout endpoint not implemented yet'
    });
  }

  /**
   * POST /api/auth/google
   * Body: { token: string }
   * Verifies Google ID token, creates/updates user, returns JWT and user profile
   */
  async googleAuth(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: 'Google ID token is required' });
      return;
    }
    try {
      // Verify Google ID token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: appConfig.googleClientId,
      });
      const payload = ticket.getPayload() as TokenPayload;
      if (!payload || !payload.sub || !payload.email) {
        res.status(401).json({ success: false, error: 'Invalid Google token' });
        return;
      }
      // Find or create user
      let user = await UserModel.findOne({ googleId: payload.sub });
      if (!user) {
        user = await UserModel.create({
          googleId: payload.sub,
          email: payload.email,
          name: payload.name || payload.email,
          profilePicture: payload.picture,
          preferences: [],
          isActive: true,
        });
      } else {
        // Update user info if changed
        user.email = payload.email;
        user.name = payload.name || payload.email;
        user.profilePicture = payload.picture;
        user.isActive = true;
        await user.save();
      }
      // Issue JWT
      const jwtPayload = {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      };
      const jwtToken = jwt.sign(
        jwtPayload,
        appConfig.jwtSecret as string,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
      );
      res.status(200).json({
        success: true,
        token: jwtToken,
        user: jwtPayload,
      });
    } catch (error) {
      res.status(401).json({ success: false, error: 'Google authentication failed' });
    }
  }

  async facebookAuth(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      error: 'Facebook authentication not implemented yet'
    });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      error: 'Forgot password not implemented yet'
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      error: 'Reset password not implemented yet'
    });
  }

  /**
   * GET /api/auth/profile
   * Returns the authenticated user's profile (requires JWT)
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    // User is attached by auth middleware
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(200).json({ success: true, user });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      error: 'Update profile not implemented yet'
    });
  }
} 