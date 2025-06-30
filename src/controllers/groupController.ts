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
} 