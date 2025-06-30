import { GroupModel, IGroup } from '@/models/Group';
import { UserModel } from '@/models/User';
import { GroupPreferences, GenrePreference } from '@/types';
import { generateInvitationCode } from '@/utils/helpers';

export class GroupService {
  async createGroup(name: string, ownerId: string): Promise<IGroup> {
    const invitationCode = generateInvitationCode();
    
    const group = new GroupModel({
      name,
      ownerId,
      invitationCode,
      members: [{ userId: ownerId, joinedAt: new Date(), preferences: [] }]
    });

    return await group.save();
  }

  async getGroupById(groupId: string): Promise<IGroup | null> {
    return await GroupModel.findById(groupId);
  }

  async getUserGroups(userId: string): Promise<IGroup[]> {
    return await GroupModel.find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ],
      isActive: true
    });
  }

  async joinGroup(invitationCode: string, userId: string): Promise<IGroup | null> {
    const group = await GroupModel.findOne({ invitationCode, isActive: true });
    
    if (!group) {
      return null;
    }

    // Check if user is already a member
    const isMember = group.members.some(member => member.userId === userId);
    if (isMember) {
      return group;
    }

    // Add user to group
    group.members.push({ userId, joinedAt: new Date(), preferences: [] });
    return await group.save();
  }

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const group = await GroupModel.findById(groupId);
    
    if (!group) {
      return false;
    }

    // Remove user from members
    group.members = group.members.filter(member => member.userId !== userId);
    
    // If no members left, deactivate group
    if (group.members.length === 0) {
      group.isActive = false;
    }

    await group.save();
    return true;
  }

  async updateMemberPreferences(groupId: string, userId: string, preferences: GenrePreference[]): Promise<boolean> {
    const group = await GroupModel.findById(groupId);
    
    if (!group) {
      return false;
    }

    const memberIndex = group.members.findIndex(member => member.userId === userId);
    if (memberIndex === -1) {
      return false;
    }

    group.members[memberIndex].preferences = preferences;
    await group.save();
    return true;
  }

  async getGroupPreferences(groupId: string): Promise<GroupPreferences> {
    const group = await GroupModel.findById(groupId).populate('members.userId');
    
    if (!group) {
      throw new Error('Group not found');
    }

    // Calculate common genres
    const genreCounts = new Map<number, { name: string; totalWeight: number; count: number }>();
    
    group.members.forEach(member => {
      member.preferences.forEach(pref => {
        if (!genreCounts.has(pref.genreId)) {
          genreCounts.set(pref.genreId, { name: pref.genreName, totalWeight: 0, count: 0 });
        }
        const genre = genreCounts.get(pref.genreId)!;
        genre.totalWeight += pref.weight;
        genre.count += 1;
      });
    });

    // Find common genres (preferred by more than 50% of members)
    const commonGenres: GenrePreference[] = [];
    const memberCount = group.members.length;
    
    genreCounts.forEach((genre, genreId) => {
      if (genre.count > memberCount / 2) {
        commonGenres.push({
          genreId,
          genreName: genre.name,
          weight: Math.round(genre.totalWeight / genre.count)
        });
      }
    });

    // Create individual preferences map
    const individualPreferences = new Map<string, GenrePreference[]>();
    group.members.forEach(member => {
      individualPreferences.set(member.userId, member.preferences);
    });

    return {
      groupId,
      commonGenres,
      individualPreferences
    };
  }

  async deleteGroup(groupId: string, ownerId: string): Promise<boolean> {
    const group = await GroupModel.findOne({ _id: groupId, ownerId });
    
    if (!group) {
      return false;
    }

    group.isActive = false;
    await group.save();
    return true;
  }

  async generateNewInviteCode(groupId: string, ownerId: string): Promise<string | null> {
    const group = await GroupModel.findOne({ _id: groupId, ownerId });
    
    if (!group) {
      return null;
    }

    group.invitationCode = generateInvitationCode();
    await group.save();
    return group.invitationCode;
  }
} 