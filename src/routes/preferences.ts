import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { UserPreferenceService } from '../services/userPreferenceService';
import { IUser } from '../models/User';

const router = express.Router();

// Get available genres
router.get('/genres', authenticateToken, async (req: express.Request, res) => {
  try {
    const genres = UserPreferenceService.getAvailableGenres();
    
    return res.json({
      success: true,
      data: {
        genres,
        totalGenres: genres.length
      }
    });
  } catch (error) {
    console.error('Error getting available genres:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get available genres'
    });
  }
});

// Create user preferences for a group
router.post('/:groupId', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const { genres } = req.body;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    if (!genres || !Array.isArray(genres)) {
      return res.status(400).json({
        success: false,
        error: 'Genres array is required'
      });
    }

    const preference = await UserPreferenceService.createPreferences({
      userId,
      groupId,
      genres
    });

    return res.status(201).json({
      success: true,
      data: {
        id: preference._id,
        userId: preference.userId,
        groupId: preference.groupId,
        genres: preference.genres,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt
      },
      message: 'Genre preferences saved successfully'
    });
  } catch (error) {
    console.error('Error creating preferences:', error);
    if (error instanceof Error) {
      if (error.message === 'Invalid user') {
        return res.status(400).json({
          success: false,
          error: 'Invalid user'
        });
      }
      if (error.message === 'Invalid group') {
        return res.status(400).json({
          success: false,
          error: 'Invalid group'
        });
      }
      if (error.message === 'User is not a member of this group') {
        return res.status(403).json({
          success: false,
          error: 'You must be a member of this group to set preferences'
        });
      }
      if (error.message === 'At least one genre must be selected') {
        return res.status(400).json({
          success: false,
          error: 'At least one genre must be selected'
        });
      }
      if (error.message === 'Maximum 10 genres can be selected') {
        return res.status(400).json({
          success: false,
          error: 'Maximum 10 genres can be selected'
        });
      }
      if (error.message.includes('Invalid genre:')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      if (error.message === 'User preferences already exist for this group') {
        return res.status(409).json({
          success: false,
          error: 'Preferences already exist for this group. Use PUT to update.'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to create preferences'
    });
  }
});

// Update user preferences for a group
router.put('/:groupId', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const { genres } = req.body;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    if (!genres || !Array.isArray(genres)) {
      return res.status(400).json({
        success: false,
        error: 'Genres array is required'
      });
    }

    const preference = await UserPreferenceService.updatePreferences(userId, groupId, { genres });

    return res.json({
      success: true,
      data: {
        id: preference._id,
        userId: preference.userId,
        groupId: preference.groupId,
        genres: preference.genres,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt
      },
      message: 'Genre preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    if (error instanceof Error) {
      if (error.message === 'At least one genre must be selected') {
        return res.status(400).json({
          success: false,
          error: 'At least one genre must be selected'
        });
      }
      if (error.message === 'Maximum 10 genres can be selected') {
        return res.status(400).json({
          success: false,
          error: 'Maximum 10 genres can be selected'
        });
      }
      if (error.message.includes('Invalid genre:')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      if (error.message === 'User preferences not found for this group') {
        return res.status(404).json({
          success: false,
          error: 'Preferences not found for this group'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

// Get user preferences for a group
router.get('/:groupId', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    const preference = await UserPreferenceService.getUserPreferences(userId, groupId);

    if (!preference) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found for this group'
      });
    }

    return res.json({
      success: true,
      data: {
        id: preference._id,
        userId: preference.userId,
        groupId: preference.groupId,
        genres: preference.genres,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt
      }
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get preferences'
    });
  }
});

// Get all user preferences across all groups
router.get('/', authenticateToken, async (req: express.Request, res) => {
  try {
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    const preferences = await UserPreferenceService.getUserAllPreferences(userId);

    return res.json({
      success: true,
      data: preferences.map(preference => ({
        id: preference._id,
        userId: preference.userId,
        groupId: preference.groupId,
        group: preference.groupId,
        genres: preference.genres,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error getting all preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get preferences'
    });
  }
});

// Delete user preferences for a group
router.delete('/:groupId', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    await UserPreferenceService.deletePreferences(userId, groupId);

    return res.json({
      success: true,
      message: 'Preferences deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting preferences:', error);
    if (error instanceof Error && error.message === 'User preferences not found for this group') {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found for this group'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to delete preferences'
    });
  }
});

// Get group genre statistics
router.get('/:groupId/stats', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    const stats = await UserPreferenceService.getGroupGenreStats(groupId);

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting group genre stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get group genre statistics'
    });
  }
});

// Check if user has preferences for a group
router.get('/:groupId/check', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    const hasPreferences = await UserPreferenceService.hasPreferences(userId, groupId);

    return res.json({
      success: true,
      data: {
        hasPreferences,
        groupId
      }
    });
  } catch (error) {
    console.error('Error checking preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check preferences'
    });
  }
});

export default router; 