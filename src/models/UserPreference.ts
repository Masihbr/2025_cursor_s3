import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreference extends Document {
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  genres: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userPreferenceSchema = new Schema<IUserPreference>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  genres: [{
    type: String,
    enum: [
      'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
      'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance',
      'Sci-Fi', 'Thriller', 'War', 'Western', 'Biography', 'History',
      'Music', 'Sport', 'Superhero', 'Musical', 'Film-Noir', 'Short'
    ],
    required: true
  }],
}, {
  timestamps: true
});

// Ensure unique combination of user and group
userPreferenceSchema.index({ userId: 1, groupId: 1 }, { unique: true });

// Index for efficient queries
userPreferenceSchema.index({ groupId: 1 });
userPreferenceSchema.index({ userId: 1 });

export const UserPreference = mongoose.model<IUserPreference>('UserPreference', userPreferenceSchema); 