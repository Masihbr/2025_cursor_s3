import { Request, Response } from 'express';
import { GroupService } from '@/services/groupService';

const groupService = new GroupService();

export class GroupController {
  /**
   * POST /api/groups
   * Creates a new group with the authenticated user as owner
   */
  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      const userId = (req as any).user.id;

      if (!name || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Group name is required'
        });
        return;
      }

      const group = await groupService.createGroup(name.trim(), userId);
      
      res.status(201).json({
        success: true,
        data: {
          id: (group as any)._id,
          name: group.name,
          ownerId: group.ownerId,
          invitationCode: group.invitationCode,
          members: group.members,
          isActive: group.isActive,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create group'
      });
    }
  }

  /**
   * GET /api/groups
   * Returns all groups where the authenticated user is a member or owner
   */
  async getUserGroups(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const groups = await groupService.getUserGroups(userId);
      
      res.status(200).json({
        success: true,
        data: groups.map(group => ({
          id: (group as any)._id,
          name: group.name,
          ownerId: group.ownerId,
          invitationCode: group.invitationCode,
          members: group.members,
          isActive: group.isActive,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user groups'
      });
    }
  }

  /**
   * GET /api/groups/:groupId
   * Returns details of a specific group (user must be a member)
   */
  async getGroupById(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user.id;
      
      const group = await groupService.getGroupById(groupId);
      
      if (!group) {
        res.status(404).json({
          success: false,
          error: 'Group not found'
        });
        return;
      }

      // Check if user is a member of the group
      const isMember = group.members.some(member => member.userId === userId);
      if (!isMember && group.ownerId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You are not a member of this group.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: (group as any)._id,
          name: group.name,
          ownerId: group.ownerId,
          invitationCode: group.invitationCode,
          members: group.members,
          isActive: group.isActive,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch group details'
      });
    }
  }

  /**
   * DELETE /api/groups/:groupId
   * Deletes a group (only the owner can delete)
   */
  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user.id;
      
      const success = await groupService.deleteGroup(groupId, userId);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Group not found or you are not the owner'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Group deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete group'
      });
    }
  }

  /**
   * POST /api/groups/:groupId/invite
   * Generates a new invitation code for the group (only owner can generate)
   */
  async generateInviteCode(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user.id;
      
      const newInviteCode = await groupService.generateNewInviteCode(groupId, userId);
      
      if (!newInviteCode) {
        res.status(404).json({
          success: false,
          error: 'Group not found or you are not the owner'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          invitationCode: newInviteCode
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate invitation code'
      });
    }
  }

  /**
   * GET /api/groups/invite/:inviteCode
   * Returns details about a group invitation
   */
  async getInviteDetails(req: Request, res: Response): Promise<void> {
    try {
      const { inviteCode } = req.params;
      
      const group = await groupService.getGroupByInviteCode(inviteCode);
      
      if (!group) {
        res.status(404).json({
          success: false,
          error: 'Invalid invitation code'
        });
        return;
      }

      if (!group.isActive) {
        res.status(400).json({
          success: false,
          error: 'This group is no longer active'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          groupId: (group as any)._id,
          groupName: group.name,
          memberCount: group.members.length,
          isActive: group.isActive
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch invitation details'
      });
    }
  }

  /**
   * POST /api/groups/join
   * Join a group using an invitation code
   */
  async joinGroup(req: Request, res: Response): Promise<void> {
    try {
      const { invitationCode } = req.body;
      const userId = (req as any).user.id;

      if (!invitationCode || invitationCode.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invitation code is required'
        });
        return;
      }

      const result = await groupService.joinGroup(invitationCode.trim().toUpperCase(), userId);
      
      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Invalid invitation code or group not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          groupId: (result as any)._id,
          groupName: result.name,
          message: 'Successfully joined the group'
        }
      });
    } catch (error) {
      console.error('Join group error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to join group'
      });
    }
  }

  /**
   * POST /api/groups/:groupId/leave
   * Leave a group
   */
  async leaveGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user.id;
      
      const success = await groupService.leaveGroup(groupId, userId);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Group not found or you are not a member'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Successfully left the group'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to leave group'
      });
    }
  }

  /**
   * POST /api/groups/:groupId/preferences
   * Update user's genre preferences for a group
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { preferences } = req.body;
      const userId = (req as any).user.id;

      if (!preferences || !Array.isArray(preferences)) {
        res.status(400).json({
          success: false,
          error: 'Preferences array is required'
        });
        return;
      }

      // Validate preferences structure
      for (const pref of preferences) {
        if (!pref.genreId || !pref.genreName || typeof pref.weight !== 'number' || pref.weight < 1 || pref.weight > 10) {
          res.status(400).json({
            success: false,
            error: 'Each preference must have genreId, genreName, and weight (1-10)'
          });
          return;
        }
      }

      const success = await groupService.updateMemberPreferences(groupId, userId, preferences);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Group not found or you are not a member'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  }

  /**
   * GET /api/groups/:groupId/preferences
   * Get group preferences (aggregated from all members)
   */
  async getGroupPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user.id;
      
      // Check if user is a member of the group
      const group = await groupService.getGroupById(groupId);
      if (!group) {
        res.status(404).json({
          success: false,
          error: 'Group not found'
        });
        return;
      }

      const isMember = group.members.some(member => member.userId === userId);
      if (!isMember && group.ownerId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You are not a member of this group.'
        });
        return;
      }

      const preferences = await groupService.getGroupPreferences(groupId);
      
      if (!preferences) {
        res.status(404).json({
          success: false,
          error: 'Group preferences not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Get group preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch group preferences'
      });
    }
  }
} 