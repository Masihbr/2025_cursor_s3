import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { User, IUser } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user: IUser;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
      return;
    }

    const decoded = await verifyToken(token);
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user || !user.isActive) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid or inactive user' 
      });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

export const optionalAuth = async (
  req: Request & { user?: IUser },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await verifyToken(token);
      const user = await User.findById(decoded.userId).select('-__v');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}; 