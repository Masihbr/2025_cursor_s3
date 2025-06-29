import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { GroupService } from '../services/groupService';
import { IUser } from '../models/User';

const router = express.Router();

// Create a new group
router.post('/', authenticateToken, async (req: express.Request, res) => {
  try {
    const { name, description } = req.body;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Group name must be 100 characters or less'
      });
    }

    if (description && description.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Group description must be 500 characters or less'
      });
    }

    const group = await GroupService.createGroup({
      name: name.trim(),
      description: description?.trim(),
      ownerId: userId
    });

    return res.status(201).json({
      success: true,
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        invitationCode: group.invitationCode,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create group'
    });
  }
});

// Get all groups for a user
router.get('/', authenticateToken, async (req: express.Request, res) => {
  try {
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();
    const groups = await GroupService.getUserGroups(userId);

    return res.json({
      success: true,
      data: groups.map(group => ({
        id: group._id,
        name: group.name,
        description: group.description,
        owner: {
          id: group.owner._id,
          name: group.owner.name,
          email: group.owner.email,
          picture: group.owner.picture
        },
        members: group.members.map(member => ({
          id: member._id,
          name: member.name,
          email: member.email,
          picture: member.picture
        })),
        invitationCode: group.invitationCode,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error getting user groups:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user groups'
    });
  }
});

// Get a specific group
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

    const group = await GroupService.getGroupById(groupId, userId);

    return res.json({
      success: true,
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        owner: {
          id: group.owner._id,
          name: group.owner.name,
          email: group.owner.email,
          picture: group.owner.picture
        },
        members: group.members.map(member => ({
          id: member._id,
          name: member.name,
          email: member.email,
          picture: member.picture
        })),
        invitationCode: group.invitationCode,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
    });
  } catch (error) {
    console.error('Error getting group:', error);
    if (error instanceof Error && error.message === 'Group not found or access denied') {
      return res.status(404).json({
        success: false,
        error: 'Group not found or access denied'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get group'
    });
  }
});

// Join a group using invitation code
router.post('/join', authenticateToken, async (req: express.Request, res) => {
  try {
    const { invitationCode } = req.body;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!invitationCode || typeof invitationCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invitation code is required'
      });
    }

    const group = await GroupService.joinGroup(invitationCode, userId);

    return res.status(200).json({
      success: true,
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        invitationCode: group.invitationCode,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      },
      message: 'Successfully joined the group'
    });
  } catch (error) {
    console.error('Error joining group:', error);
    if (error instanceof Error) {
      if (error.message === 'Invalid invitation code') {
        return res.status(400).json({
          success: false,
          error: 'Invalid invitation code'
        });
      }
      if (error.message === 'User is already a member of this group') {
        return res.status(400).json({
          success: false,
          error: 'You are already a member of this group'
        });
      }
      if (error.message === 'User is already in maximum number of groups') {
        return res.status(400).json({
          success: false,
          error: 'You are already in the maximum number of groups (10)'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to join group'
    });
  }
});

// Leave a group
router.delete('/:groupId/leave', authenticateToken, async (req: express.Request, res) => {
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

    await GroupService.leaveGroup(groupId, userId);

    return res.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    if (error instanceof Error) {
      if (error.message === 'Group not found') {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }
      if (error.message === 'User is not a member of this group') {
        return res.status(400).json({
          success: false,
          error: 'You are not a member of this group'
        });
      }
      if (error.message.includes('Group owner cannot leave')) {
        return res.status(400).json({
          success: false,
          error: 'Group owner cannot leave the group. Please delete the group instead.'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to leave group'
    });
  }
});

// Delete a group (owner only)
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

    await GroupService.deleteGroup(groupId, userId);

    return res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    if (error instanceof Error) {
      if (error.message === 'Group not found') {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }
      if (error.message === 'Only group owner can delete the group') {
        return res.status(403).json({
          success: false,
          error: 'Only group owner can delete the group'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to delete group'
    });
  }
});

// Get group invitation code
router.get('/:groupId/invitation', authenticateToken, async (req: express.Request, res) => {
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

    const invitationCode = await GroupService.getInvitationCode(groupId, userId);

    return res.json({
      success: true,
      data: {
        invitationCode,
        groupId
      }
    });
  } catch (error) {
    console.error('Error getting invitation code:', error);
    if (error instanceof Error && error.message === 'Group not found or access denied') {
      return res.status(404).json({
        success: false,
        error: 'Group not found or access denied'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get invitation code'
    });
  }
});

// Get group statistics
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

    const stats = await GroupService.getGroupStats(groupId, userId);

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting group stats:', error);
    if (error instanceof Error && error.message === 'Group not found or access denied') {
      return res.status(404).json({
        success: false,
        error: 'Group not found or access denied'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get group statistics'
    });
  }
});

export default router; 