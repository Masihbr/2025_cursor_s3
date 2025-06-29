import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  invitationCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  invitationCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure owner is always in members array
groupSchema.pre('save', function(next) {
  if (this.isModified('owner') && !this.members.includes(this.owner)) {
    this.members.push(this.owner);
  }
  next();
});

// Generate unique invitation code
groupSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('invitationCode')) {
    const { v4: uuidv4 } = await import('uuid');
    this.invitationCode = uuidv4().substring(0, 8).toUpperCase();
  }
  next();
});

// Indexes for efficient queries
groupSchema.index({ owner: 1, isActive: 1 });
groupSchema.index({ members: 1, isActive: 1 });
groupSchema.index({ invitationCode: 1, isActive: 1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema); 