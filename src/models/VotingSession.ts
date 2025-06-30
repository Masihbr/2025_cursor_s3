import mongoose, { Document, Schema } from 'mongoose';
import { VotingSession, Vote, Movie } from '@/types';

export interface IVotingSession {
  groupId: string;
  status: 'pending' | 'active' | 'completed';
  movies: Movie[];
  votes: Vote[];
  startTime?: Date;
  endTime?: Date;
  selectedMovie?: Movie;
  createdAt: Date;
  updatedAt: Date;
}

export interface VotingSessionDocument extends IVotingSession, Document {}

const MovieGenreSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true }
});

const MovieSchema = new Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  overview: { type: String, required: true },
  posterPath: { type: String },
  backdropPath: { type: String },
  releaseDate: { type: String, required: true },
  genres: [MovieGenreSchema],
  voteAverage: { type: Number, required: true },
  voteCount: { type: Number, required: true },
  runtime: { type: Number },
  tagline: { type: String }
});

const VoteSchema = new Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  movieId: { type: Number, required: true },
  vote: { type: String, enum: ['yes', 'no'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const VotingSessionSchema = new Schema({
  groupId: {
    type: String,
    required: true,
    ref: 'Group'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  movies: [MovieSchema],
  votes: [VoteSchema],
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  selectedMovie: MovieSchema
}, {
  timestamps: true
});

// Indexes
VotingSessionSchema.index({ groupId: 1 });
VotingSessionSchema.index({ status: 1 });
VotingSessionSchema.index({ 'votes.userId': 1 });
VotingSessionSchema.index({ 'votes.movieId': 1 });

export const VotingSessionModel = mongoose.model<VotingSessionDocument>('VotingSession', VotingSessionSchema); 