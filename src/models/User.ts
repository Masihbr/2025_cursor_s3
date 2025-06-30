import mongoose, { Document, Schema } from 'mongoose';
import { GenrePreference } from '@/types';

export interface IUser {
  email: string;
  name: string;
  passwordHash?: string;
  profilePicture?: string;
  preferences: GenrePreference[];
  googleId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends IUser, Document {}

const GenrePreferenceSchema = new Schema({
  genreId: { type: Number, required: true },
  genreName: { type: String, required: true },
  weight: { type: Number, required: true, min: 1, max: 10, default: 5 }
});

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: false
  },
  profilePicture: {
    type: String,
    required: false
  },
  preferences: [GenrePreferenceSchema],
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.passwordHash;
      return ret;
    }
  }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ isActive: 1 });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema); 