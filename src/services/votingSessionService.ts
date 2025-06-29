import { VotingSession, IVotingSession } from '../models/VotingSession';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { UserPreferenceService } from './userPreferenceService';
import { MovieRecommendationService } from './movieRecommendationService';
import mongoose from 'mongoose';

export interface CreateVotingSessionData {
  groupId: string;
  createdBy: string;
  settings?: {
    maxRecommendations?: number;
    votingDuration?: number;
    requireAllMembers?: boolean;
  };
}

export interface VoteData {
  userId: string;
  movieId: string;
  vote: 'like' | 'dislike' | 'neutral';
}

export interface VotingSessionWithDetails extends IVotingSession {
  group: any;
  createdByUser: any;
  memberVoteCounts: {
    totalMembers: number;
    votedMembers: number;
    pendingMembers: number;
  };
}

export class VotingSessionService {
  /**
   * Create a new voting session
   */
  static async createVotingSession(data: CreateVotingSessionData): Promise<IVotingSession> {
    const { groupId, createdBy, settings } = data;

    // Verify group exists and is active
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      throw new Error('Group not found or inactive');
    }

    // Verify creator is group owner
    if (!group.owner.equals(new mongoose.Types.ObjectId(createdBy))) {
      throw new Error('Only group owner can create voting sessions');
    }

    // Check if there's already an active session
    const existingSession = await VotingSession.findOne({
      groupId: new mongoose.Types.ObjectId(groupId),
      status: 'active'
    });

    if (existingSession) {
      throw new Error('There is already an active voting session for this group');
    }

    // Check if all members have set preferences (if required)
    if (settings?.requireAllMembers !== false) {
      const allMembersHavePreferences = await this.checkAllMembersHavePreferences(groupId);
      if (!allMembersHavePreferences) {
        throw new Error('All group members must set their genre preferences before starting a voting session');
      }
    }

    // Generate movie recommendations
    const maxRecommendations = settings?.maxRecommendations || 10;
    const recommendations = await MovieRecommendationService.generateRecommendations(groupId, maxRecommendations);

    if (recommendations.length === 0) {
      throw new Error('No movie recommendations available for this group');
    }

    // Create voting session
    const votingSession = new VotingSession({
      groupId: new mongoose.Types.ObjectId(groupId),
      createdBy: new mongoose.Types.ObjectId(createdBy),
      movieRecommendations: recommendations,
      settings: {
        maxRecommendations: settings?.maxRecommendations || 10,
        votingDuration: settings?.votingDuration || 60,
        requireAllMembers: settings?.requireAllMembers !== false
      }
    });

    return await votingSession.save();
  }

  /**
   * Get voting session with details
   */
  static async getVotingSession(sessionId: string, userId: string): Promise<VotingSessionWithDetails> {
    const session = await VotingSession.findById(sessionId)
      .populate('groupId')
      .populate('createdBy', 'name email picture');

    if (!session) {
      throw new Error('Voting session not found');
    }

    // Verify user is a member of the group
    const group = await Group.findById(session.groupId);
    if (!group || !group.members.some(memberId => memberId.equals(new mongoose.Types.ObjectId(userId)))) {
      throw new Error('Access denied to this voting session');
    }

    // Calculate member vote counts
    const memberVoteCounts = await this.calculateMemberVoteCounts(session);

    return {
      ...session.toObject(),
      memberVoteCounts
    } as unknown as VotingSessionWithDetails;
  }

  /**
   * Get active voting session for a group
   */
  static async getActiveVotingSession(groupId: string, userId: string): Promise<VotingSessionWithDetails | null> {
    const session = await VotingSession.findOne({
      groupId: new mongoose.Types.ObjectId(groupId),
      status: 'active'
    }).populate('createdBy', 'name email picture');

    if (!session) {
      return null;
    }

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.some(memberId => memberId.equals(new mongoose.Types.ObjectId(userId)))) {
      throw new Error('Access denied to this voting session');
    }

    // Calculate member vote counts
    const memberVoteCounts = await this.calculateMemberVoteCounts(session);

    return {
      ...session.toObject(),
      memberVoteCounts
    } as unknown as VotingSessionWithDetails;
  }

  /**
   * Submit a vote
   */
  static async submitVote(sessionId: string, voteData: VoteData): Promise<void> {
    const { userId, movieId, vote } = voteData;

    const session = await VotingSession.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Voting session is not active');
    }

    // Verify user is a member of the group
    const group = await Group.findById(session.groupId);
    if (!group || !group.members.some(memberId => memberId.equals(new mongoose.Types.ObjectId(userId)))) {
      throw new Error('Only group members can vote');
    }

    // Verify movie is in recommendations
    const movieExists = session.movieRecommendations.some(movie => movie.movieId === movieId);
    if (!movieExists) {
      throw new Error('Invalid movie for this voting session');
    }

    // Remove existing vote for this user and movie
    session.votes = session.votes.filter(v => 
      !(v.userId.equals(new mongoose.Types.ObjectId(userId)) && v.movieId === movieId)
    );

    // Add new vote
    session.votes.push({
      userId: new mongoose.Types.ObjectId(userId),
      movieId,
      vote,
      timestamp: new Date()
    });

    await session.save();
  }

  /**
   * Get user's votes for a session
   */
  static async getUserVotes(sessionId: string, userId: string): Promise<any[]> {
    const session = await VotingSession.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    return session.votes
      .filter(vote => vote.userId.equals(new mongoose.Types.ObjectId(userId)))
      .map(vote => ({
        movieId: vote.movieId,
        vote: vote.vote,
        timestamp: vote.timestamp
      }));
  }

  /**
   * Complete voting session and calculate results
   */
  static async completeVotingSession(sessionId: string, userId: string): Promise<IVotingSession> {
    const session = await VotingSession.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    // Verify user is the session creator
    if (!session.createdBy.equals(new mongoose.Types.ObjectId(userId))) {
      throw new Error('Only session creator can complete the voting session');
    }

    if (session.status !== 'active') {
      throw new Error('Voting session is already completed or cancelled');
    }

    // Calculate results
    const results = this.calculateResults(session);
    
    session.results = results;
    session.status = 'completed';
    session.endedAt = new Date();

    return await session.save();
  }

  /**
   * Cancel voting session
   */
  static async cancelVotingSession(sessionId: string, userId: string): Promise<IVotingSession> {
    const session = await VotingSession.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    // Verify user is the session creator
    if (!session.createdBy.equals(new mongoose.Types.ObjectId(userId))) {
      throw new Error('Only session creator can cancel the voting session');
    }

    if (session.status !== 'active') {
      throw new Error('Voting session is already completed or cancelled');
    }

    session.status = 'cancelled';
    session.endedAt = new Date();

    return await session.save();
  }

  /**
   * Get voting session history for a group
   */
  static async getVotingHistory(groupId: string, userId: string): Promise<IVotingSession[]> {
    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.members.some(memberId => memberId.equals(new mongoose.Types.ObjectId(userId)))) {
      throw new Error('Access denied to group voting history');
    }

    return await VotingSession.find({
      groupId: new mongoose.Types.ObjectId(groupId)
    })
    .populate('createdBy', 'name email picture')
    .sort({ createdAt: -1 });
  }

  /**
   * Check if all group members have set preferences
   */
  private static async checkAllMembersHavePreferences(groupId: string): Promise<boolean> {
    const group = await Group.findById(groupId);
    if (!group) {
      return false;
    }

    const totalMembers = group.members.length;
    const membersWithPreferences = await UserPreferenceService.getGroupPreferences(groupId);
    
    return membersWithPreferences.length === totalMembers;
  }

  /**
   * Calculate member vote counts
   */
  private static async calculateMemberVoteCounts(session: IVotingSession): Promise<any> {
    const group = await Group.findById(session.groupId);
    if (!group) {
      return { totalMembers: 0, votedMembers: 0, pendingMembers: 0 };
    }

    const totalMembers = group.members.length;
    const uniqueVoters = new Set(session.votes.map(vote => vote.userId.toString()));
    const votedMembers = uniqueVoters.size;
    const pendingMembers = totalMembers - votedMembers;

    return {
      totalMembers,
      votedMembers,
      pendingMembers
    };
  }

  /**
   * Calculate voting results
   */
  private static calculateResults(session: IVotingSession): any[] {
    const voteCounts: { [movieId: string]: { likes: number; dislikes: number; neutrals: number } } = {};

    // Initialize vote counts for all recommended movies
    for (const movie of session.movieRecommendations) {
      voteCounts[movie.movieId] = { likes: 0, dislikes: 0, neutrals: 0 };
    }

    // Count votes
    for (const vote of session.votes) {
      const movieId = vote.movieId;
      if (voteCounts[movieId]) {
        switch (vote.vote) {
          case 'like':
            voteCounts[movieId].likes++;
            break;
          case 'dislike':
            voteCounts[movieId].dislikes++;
            break;
          case 'neutral':
            voteCounts[movieId].neutrals++;
            break;
        }
      }
    }

    // Calculate results
    const results = session.movieRecommendations.map(movie => {
      const counts = voteCounts[movie.movieId];
      if (!counts) {
        return {
          movieId: movie.movieId,
          title: movie.title,
          year: movie.year,
          genres: movie.genres,
          posterUrl: movie.posterUrl,
          likeCount: 0,
          dislikeCount: 0,
          neutralCount: 0,
          totalVotes: 0,
          score: 0
        };
      }
      
      const totalVotes = counts.likes + counts.dislikes + counts.neutrals;
      
      // Calculate score: (likes - dislikes) / totalVotes * 100
      const score = totalVotes > 0 ? ((counts.likes - counts.dislikes) / totalVotes) * 100 : 0;

      return {
        movieId: movie.movieId,
        title: movie.title,
        year: movie.year,
        genres: movie.genres,
        posterUrl: movie.posterUrl,
        likeCount: counts.likes,
        dislikeCount: counts.dislikes,
        neutralCount: counts.neutrals,
        totalVotes,
        score: Math.round(score)
      };
    });

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get voting statistics
   */
  static async getVotingStats(sessionId: string): Promise<any> {
    const session = await VotingSession.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    const group = await Group.findById(session.groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const totalMembers = group.members.length;
    const uniqueVoters = new Set(session.votes.map(vote => vote.userId.toString()));
    const votedMembers = uniqueVoters.size;
    const participationRate = totalMembers > 0 ? (votedMembers / totalMembers) * 100 : 0;

    const totalVotes = session.votes.length;
    const voteBreakdown = {
      likes: session.votes.filter(v => v.vote === 'like').length,
      dislikes: session.votes.filter(v => v.vote === 'dislike').length,
      neutrals: session.votes.filter(v => v.vote === 'neutral').length
    };

    return {
      totalMembers,
      votedMembers,
      pendingMembers: totalMembers - votedMembers,
      participationRate: Math.round(participationRate),
      totalVotes,
      voteBreakdown,
      sessionStatus: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt
    };
  }
} 