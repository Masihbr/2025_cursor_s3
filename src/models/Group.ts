import mongoose, { Document, Schema } from 'mongoose';
import { Group, GroupMember } from '@/types';

export interface IGroup {
  name: string;
  ownerId: string;
  invitationCode: string;
  members: GroupMember[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupDocument extends IGroup, Document {}

const GroupMemberSchema = new Schema({
  userId: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  preferences: [{
    genreId: { type: Number, required: true },
    genreName: { type: String, required: true },
    weight: { type: Number, required: true, min: 1, max: 10, default: 5 }
  }]
});

const GroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  invitationCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  members: [GroupMemberSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
GroupSchema.index({ ownerId: 1 });
GroupSchema.index({ invitationCode: 1 });
GroupSchema.index({ isActive: 1 });
GroupSchema.index({ 'members.userId': 1 });

export const GroupModel = mongoose.model<GroupDocument>('Group', GroupSchema); 