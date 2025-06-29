import mongoose, { Document, Schema } from 'mongoose';

export interface IVotingSession extends Document {
  groupId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: 'active' | 'completed' | 'cancelled';
  movieRecommendations: Array<{
    movieId: string;
    title: string;
    year: number;
    genres: string[];
    posterUrl?: string;
    score: number;
    reason: string;
  }>;
  votes: Array<{
    userId: mongoose.Types.ObjectId;
    movieId: string;
    vote: 'like' | 'dislike' | 'neutral';
    timestamp: Date;
  }>;
  results: Array<{
    movieId: string;
    title: string;
    year: number;
    genres: string[];
    posterUrl?: string;
    likeCount: number;
    dislikeCount: number;
    neutralCount: number;
    totalVotes: number;
    score: number;
  }>;
  settings: {
    maxRecommendations: number;
    votingDuration: number; // in minutes
    requireAllMembers: boolean;
  };
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const votingSessionSchema = new Schema<IVotingSession>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  movieRecommendations: [{
    movieId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    genres: [{
      type: String,
      required: true
    }],
    posterUrl: String,
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    reason: {
      type: String,
      required: true
    }
  }],
  votes: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    movieId: {
      type: String,
      required: true
    },
    vote: {
      type: String,
      enum: ['like', 'dislike', 'neutral'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  results: [{
    movieId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    genres: [{
      type: String,
      required: true
    }],
    posterUrl: String,
    likeCount: {
      type: Number,
      default: 0
    },
    dislikeCount: {
      type: Number,
      default: 0
    },
    neutralCount: {
      type: Number,
      default: 0
    },
    totalVotes: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    }
  }],
  settings: {
    maxRecommendations: {
      type: Number,
      default: 10,
      min: 5,
      max: 20
    },
    votingDuration: {
      type: Number,
      default: 60, // 60 minutes
      min: 15,
      max: 1440 // 24 hours
    },
    requireAllMembers: {
      type: Boolean,
      default: true
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
votingSessionSchema.index({ groupId: 1, status: 1 });
votingSessionSchema.index({ createdBy: 1, status: 1 });
votingSessionSchema.index({ status: 1, startedAt: 1 });

// Ensure unique active session per group
votingSessionSchema.index({ groupId: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'active' } 
});

export const VotingSession = mongoose.model<IVotingSession>('VotingSession', votingSessionSchema); 