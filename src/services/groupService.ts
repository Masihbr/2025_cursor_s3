import { GroupModel, IGroup } from '@/models/Group';
import { UserModel } from '@/models/User';
import { GroupPreferences, GenrePreference } from '@/types';
import { generateInvitationCode } from '@/utils/helpers';

export class GroupService {
  /**
   * Creates a new group with the specified name and owner
   */
  async createGroup(name: string, ownerId: string): Promise<IGroup> {
    const invitationCode = generateInvitationCode();
    
    const group = new GroupModel({
      name,
      ownerId,
      invitationCode,
      members: [{
        userId: ownerId,
        joinedAt: new Date(),
        preferences: []
      }],
      isActive: true
    });

    return await group.save();
  }

  /**
   * Gets all groups where the user is a member or owner
   */
  async getUserGroups(userId: string): Promise<IGroup[]> {
    return await GroupModel.find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ],
      isActive: true
    }).sort({ updatedAt: -1 });
  }

  /**
   * Gets a group by its ID
   */
  async getGroupById(groupId: string): Promise<IGroup | null> {
    return await GroupModel.findById(groupId);
  }

  /**
   * Gets a group by its invitation code
   */
  async getGroupByInviteCode(inviteCode: string): Promise<IGroup | null> {
    return await GroupModel.findOne({ invitationCode: inviteCode });
  }

  /**
   * Deletes a group (only the owner can delete)
   */
  async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    const group = await GroupModel.findById(groupId);
    
    if (!group || group.ownerId !== userId) {
      return false;
    }

    group.isActive = false;
    await group.save();
    
    return true;
  }

  /**
   * Generates a new invitation code for a group (only owner can generate)
   */
  async generateNewInviteCode(groupId: string, userId: string): Promise<string | null> {
    const group = await GroupModel.findById(groupId);
    
    if (!group || group.ownerId !== userId) {
      return null;
    }

    const newInviteCode = generateInvitationCode();
    group.invitationCode = newInviteCode;
    await group.save();
    
    return newInviteCode;
  }

  /**
   * Join a group using an invitation code
   */
  async joinGroup(invitationCode: string, userId: string): Promise<IGroup | null> {
    const group = await GroupModel.findOne({ invitationCode, isActive: true });
    
    if (!group) {
      return null;
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some((member: any) => member.userId === userId);
    if (isAlreadyMember) {
      return group; // User is already a member
    }

    // Check if user is the owner (owner should already be a member from group creation)
    if (group.ownerId === userId) {
      // If owner is not in members list, add them
      if (!isAlreadyMember) {
        group.members.push({
          userId,
          joinedAt: new Date(),
          preferences: []
        });
        await group.save();
      }
      return group;
    }

    // Add user to group
    group.members.push({
      userId,
      joinedAt: new Date(),
      preferences: []
    });

    return await group.save();
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const group = await GroupModel.findById(groupId);
    
    if (!group) {
      return false;
    }

    // Check if user is a member
    const isMember = group.members.some((member: any) => member.userId === userId);
    if (!isMember) {
      return false;
    }

    // Remove user from members
    group.members = group.members.filter((member: any) => member.userId !== userId);
    await group.save();
    
    return true;
  }

  /**
   * Update member preferences for a group
   */
  async updateMemberPreferences(groupId: string, userId: string, preferences: any[]): Promise<boolean> {
    const group = await GroupModel.findById(groupId);
    
    if (!group) {
      return false;
    }

    // Find and update member preferences
    const member = group.members.find((member: any) => member.userId === userId);
    if (!member) {
      return false;
    }

    member.preferences = preferences;
    await group.save();
    
    return true;
  }

  /**
   * Get group preferences (aggregated from all members)
   */
  async getGroupPreferences(groupId: string): Promise<any> {
    const group = await GroupModel.findById(groupId).populate('members.userId');
    
    if (!group) {
      return null;
    }

    // Aggregate preferences from all members
    const allPreferences: { [key: string]: number } = {};
    
    group.members.forEach((member: any) => {
      member.preferences.forEach((pref: any) => {
        if (!allPreferences[pref.genreId]) {
          allPreferences[pref.genreId] = 0;
        }
        allPreferences[pref.genreId] += pref.weight;
      });
    });

    // Convert to array and sort by weight
    const sortedPreferences = Object.entries(allPreferences)
      .map(([genreId, weight]) => ({ genreId: parseInt(genreId), weight }))
      .sort((a, b) => b.weight - a.weight);

    return {
      groupId: group._id,
      preferences: sortedPreferences,
      memberCount: group.members.length
    };
  }
} 