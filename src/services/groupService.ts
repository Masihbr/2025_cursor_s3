import { Group, IGroup } from '../models/Group';
import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

export interface CreateGroupData {
  name: string;
  description?: string;
  ownerId: string;
}

export interface GroupWithMembers {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  owner: IUser;
  members: IUser[];
  invitationCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GroupService {
  /**
   * Create a new group
   */
  static async createGroup(data: CreateGroupData): Promise<IGroup> {
    const { name, description, ownerId } = data;

    // Verify owner exists and is active
    const owner = await User.findById(ownerId);
    if (!owner || !owner.isActive) {
      throw new Error('Invalid owner');
    }

    // Check if user is already in too many groups (optional limit)
    const userGroups = await Group.countDocuments({
      members: ownerId,
      isActive: true
    });

    if (userGroups >= 10) {
      throw new Error('User is already in maximum number of groups');
    }

    const group = new Group({
      name,
      description,
      owner: ownerId,
      members: [ownerId]
    });

    return await group.save();
  }

  /**
   * Get all groups for a user
   */
  static async getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    const groups = await Group.find({
      members: userId,
      isActive: true
    })
    .populate('members', 'id name email picture')
    .populate('owner', 'id name email picture')
    .sort({ updatedAt: -1 });

    return groups as unknown as GroupWithMembers[];
  }

  /**
   * Get a specific group with members
   */
  static async getGroupById(groupId: string, userId: string): Promise<GroupWithMembers> {
    const group = await Group.findOne({
      _id: groupId,
      members: userId,
      isActive: true
    })
    .populate('members', 'id name email picture')
    .populate('owner', 'id name email picture');

    if (!group) {
      throw new Error('Group not found or access denied');
    }

    return group as unknown as GroupWithMembers;
  }

  /**
   * Join a group using invitation code
   */
  static async joinGroup(invitationCode: string, userId: string): Promise<IGroup> {
    // Verify user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new Error('Invalid user');
    }

    // Find group by invitation code
    const group = await Group.findOne({
      invitationCode: invitationCode.toUpperCase(),
      isActive: true
    });

    if (!group) {
      throw new Error('Invalid invitation code');
    }

    // Check if user is already a member
    const userIdObj = new mongoose.Types.ObjectId(userId);
    if (group.members.some(memberId => memberId.equals(userIdObj))) {
      throw new Error('User is already a member of this group');
    }

    // Check if user is in too many groups
    const userGroups = await Group.countDocuments({
      members: userId,
      isActive: true
    });

    if (userGroups >= 10) {
      throw new Error('User is already in maximum number of groups');
    }

    // Add user to group
    group.members.push(userIdObj);
    return await group.save();
  }

  /**
   * Leave a group
   */
  static async leaveGroup(groupId: string, userId: string): Promise<void> {
    const group = await Group.findById(groupId);
    
    if (!group || !group.isActive) {
      throw new Error('Group not found');
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    if (!group.members.some(memberId => memberId.equals(userIdObj))) {
      throw new Error('User is not a member of this group');
    }

    // Owner cannot leave the group (must delete it instead)
    if (group.owner.equals(userIdObj)) {
      throw new Error('Group owner cannot leave the group. Please delete the group instead.');
    }

    // Remove user from members
    group.members = group.members.filter(memberId => !memberId.equals(userIdObj));
    await group.save();
  }

  /**
   * Delete a group (owner only)
   */
  static async deleteGroup(groupId: string, userId: string): Promise<void> {
    const group = await Group.findById(groupId);
    
    if (!group || !group.isActive) {
      throw new Error('Group not found');
    }

    if (!group.owner.equals(new mongoose.Types.ObjectId(userId))) {
      throw new Error('Only group owner can delete the group');
    }

    // Soft delete by setting isActive to false
    group.isActive = false;
    await group.save();
  }

  /**
   * Get group invitation code
   */
  static async getInvitationCode(groupId: string, userId: string): Promise<string> {
    const group = await Group.findOne({
      _id: groupId,
      members: userId,
      isActive: true
    });

    if (!group) {
      throw new Error('Group not found or access denied');
    }

    return group.invitationCode;
  }

  /**
   * Check if user is group owner
   */
  static async isGroupOwner(groupId: string, userId: string): Promise<boolean> {
    const group = await Group.findOne({
      _id: groupId,
      owner: userId,
      isActive: true
    });

    return !!group;
  }

  /**
   * Check if user is group member
   */
  static async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const group = await Group.findOne({
      _id: groupId,
      members: userId,
      isActive: true
    });

    return !!group;
  }

  /**
   * Get group statistics
   */
  static async getGroupStats(groupId: string, userId: string): Promise<any> {
    const group = await this.getGroupById(groupId, userId);
    
    return {
      totalMembers: group.members.length,
      createdAt: group.createdAt,
      lastUpdated: group.updatedAt
    };
  }
} 