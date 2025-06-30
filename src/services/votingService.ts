import { VotingSessionModel, IVotingSession } from '@/models/VotingSession';
import { MovieRecommendationService } from '@/services/movieRecommendationService';
import { GroupService } from '@/services/groupService';
import { Movie, Vote } from '@/types';

export class VotingService {
  private movieRecommendationService: MovieRecommendationService;
  private groupService: GroupService;

  constructor() {
    this.movieRecommendationService = new MovieRecommendationService();
    this.groupService = new GroupService();
  }

  /**
   * Create a new voting session for a group
   */
  async createSession(groupId: string, ownerId: string): Promise<IVotingSession> {
    // Check if user is the group owner
    const group = await this.groupService.getGroupById(groupId);
    if (!group || group.ownerId !== ownerId) {
      throw new Error('Only group owner can create voting sessions');
    }

    // Check if there's already an active session
    const existingSession = await VotingSessionModel.findOne({
      groupId,
      status: { $in: ['pending', 'active'] }
    });

    if (existingSession) {
      throw new Error('There is already an active or pending voting session for this group');
    }

    // Check if all members have set their preferences
    const membersWithoutPreferences = group.members.filter(member => 
      !member.preferences || member.preferences.length === 0
    );

    if (membersWithoutPreferences.length > 0) {
      throw new Error('All group members must set their preferences before starting a voting session');
    }

    // Generate movie recommendations
    const recommendations = await this.movieRecommendationService.generateGroupRecommendations(groupId, 20);
    const movies = recommendations.map(rec => rec.movie);

    // Create the voting session
    const session = new VotingSessionModel({
      groupId,
      status: 'pending',
      movies,
      votes: [],
      startTime: null,
      endTime: null,
      selectedMovie: null
    });

    return await session.save();
  }

  /**
   * Start a voting session
   */
  async startSession(sessionId: string, ownerId: string): Promise<IVotingSession> {
    const session = await VotingSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    // Check if user is the group owner
    const group = await this.groupService.getGroupById(session.groupId);
    if (!group || group.ownerId !== ownerId) {
      throw new Error('Only group owner can start voting sessions');
    }

    if (session.status !== 'pending') {
      throw new Error('Session is not in pending status');
    }

    session.status = 'active';
    session.startTime = new Date();
    await session.save();

    return session;
  }

  /**
   * End a voting session and select the winning movie
   */
  async endSession(sessionId: string, ownerId: string): Promise<IVotingSession> {
    const session = await VotingSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    // Check if user is the group owner
    const group = await this.groupService.getGroupById(session.groupId);
    if (!group || group.ownerId !== ownerId) {
      throw new Error('Only group owner can end voting sessions');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    // Calculate results and select winning movie
    const results = this.calculateVotingResults(session);
    const winningMovie = this.selectWinningMovie(results);

    session.status = 'completed';
    session.endTime = new Date();
    session.selectedMovie = winningMovie;
    await session.save();

    return session;
  }

  /**
   * Get detailed movie selection results for a completed session
   */
  async getMovieSelectionResults(sessionId: string): Promise<{
    sessionId: string;
    groupId: string;
    selectedMovie: Movie;
    votingResults: Array<{
      movie: Movie;
      yesVotes: number;
      noVotes: number;
      totalVotes: number;
      approvalRate: number;
      score: number;
    }>;
    totalParticipants: number;
    totalVotesCast: number;
    endTime: Date;
    sessionDuration: number; // in minutes
  }> {
    const session = await VotingSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    if (session.status !== 'completed') {
      throw new Error('Voting session is not completed');
    }

    if (!session.selectedMovie) {
      throw new Error('No movie has been selected for this session');
    }

    // Get group details to count participants
    const group = await this.groupService.getGroupById(session.groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const totalParticipants = group.members.length + 1; // +1 for owner
    const totalVotesCast = session.votes.length;

    // Calculate detailed voting results
    const votingResults = this.calculateDetailedVotingResults(session);

    // Calculate session duration
    const sessionDuration = session.startTime && session.endTime 
      ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
      : 0;

    return {
      sessionId: (session as any)._id.toString(),
      groupId: session.groupId,
      selectedMovie: session.selectedMovie,
      votingResults,
      totalParticipants,
      totalVotesCast,
      endTime: session.endTime!,
      sessionDuration
    };
  }

  /**
   * Calculate detailed voting results for a session
   */
  private calculateDetailedVotingResults(session: IVotingSession): Array<{
    movie: Movie;
    yesVotes: number;
    noVotes: number;
    totalVotes: number;
    approvalRate: number;
    score: number;
  }> {
    const results: { [movieId: number]: { 
      movie: Movie; 
      yesVotes: number; 
      noVotes: number; 
      totalVotes: number; 
      approvalRate: number; 
      score: number; 
    } } = {};

    // Initialize results for all movies
    session.movies.forEach(movie => {
      results[movie.id] = {
        movie,
        yesVotes: 0,
        noVotes: 0,
        totalVotes: 0,
        approvalRate: 0,
        score: 0
      };
    });

    // Count votes
    session.votes.forEach(vote => {
      if (results[vote.movieId]) {
        if (vote.vote === 'yes') {
          results[vote.movieId].yesVotes++;
        } else {
          results[vote.movieId].noVotes++;
        }
        results[vote.movieId].totalVotes++;
      }
    });

    // Calculate approval rates and scores
    Object.values(results).forEach(result => {
      result.approvalRate = result.totalVotes > 0 
        ? Math.round((result.yesVotes / result.totalVotes) * 100) 
        : 0;
      result.score = result.yesVotes - result.noVotes + (result.movie.voteAverage * 0.1);
    });

    return Object.values(results).sort((a, b) => b.score - a.score);
  }

  /**
   * Cast a vote for a movie
   */
  async castVote(sessionId: string, userId: string, movieId: number, vote: 'yes' | 'no'): Promise<boolean> {
    const session = await VotingSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Voting session is not active');
    }

    // Check if user is a member of the group
    const group = await this.groupService.getGroupById(session.groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const isMember = group.members.some(member => member.userId === userId);
    if (!isMember && group.ownerId !== userId) {
      throw new Error('User is not a member of this group');
    }

    // Check if movie exists in the session
    const movieExists = session.movies.some(movie => movie.id === movieId);
    if (!movieExists) {
      throw new Error('Movie not found in this voting session');
    }

    // Check if user has already voted for this movie
    const existingVote = session.votes.find(v => v.userId === userId && v.movieId === movieId);
    if (existingVote) {
      // Update existing vote
      existingVote.vote = vote;
      existingVote.timestamp = new Date();
    } else {
      // Add new vote
      session.votes.push({
        id: Math.random().toString(36).substr(2, 9), // Generate simple ID
        sessionId: sessionId,
        userId,
        movieId,
        vote,
        timestamp: new Date()
      });
    }

    await session.save();
    return true;
  }

  /**
   * Get active voting session for a group
   */
  async getActiveSession(groupId: string): Promise<IVotingSession | null> {
    return await VotingSessionModel.findOne({
      groupId,
      status: { $in: ['pending', 'active'] }
    });
  }

  /**
   * Get voting session by ID
   */
  async getSessionById(sessionId: string): Promise<IVotingSession | null> {
    return await VotingSessionModel.findById(sessionId);
  }

  /**
   * Get voting session history for a group
   */
  async getSessionHistory(groupId: string): Promise<IVotingSession[]> {
    return await VotingSessionModel.find({
      groupId,
      status: 'completed'
    }).sort({ endTime: -1 });
  }

  /**
   * Get votes for a specific session
   */
  async getSessionVotes(sessionId: string): Promise<Vote[]> {
    const session = await VotingSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Voting session not found');
    }

    return session.votes;
  }

  /**
   * Calculate voting results for a session
   */
  private calculateVotingResults(session: IVotingSession): Array<{ movie: Movie; yesVotes: number; noVotes: number; score: number }> {
    const results: { [movieId: number]: { movie: Movie; yesVotes: number; noVotes: number; score: number } } = {};

    // Initialize results for all movies
    session.movies.forEach(movie => {
      results[movie.id] = {
        movie,
        yesVotes: 0,
        noVotes: 0,
        score: 0
      };
    });

    // Count votes
    session.votes.forEach(vote => {
      if (results[vote.movieId]) {
        if (vote.vote === 'yes') {
          results[vote.movieId].yesVotes++;
        } else {
          results[vote.movieId].noVotes++;
        }
      }
    });

    // Calculate scores (yes votes minus no votes, plus movie rating bonus)
    Object.values(results).forEach(result => {
      result.score = result.yesVotes - result.noVotes + (result.movie.voteAverage * 0.1);
    });

    return Object.values(results).sort((a, b) => b.score - a.score);
  }

  /**
   * Select the winning movie based on voting results
   */
  private selectWinningMovie(results: Array<{ movie: Movie; yesVotes: number; noVotes: number; score: number }>): Movie {
    // Filter movies with at least one yes vote
    const moviesWithYesVotes = results.filter(result => result.yesVotes > 0);
    
    if (moviesWithYesVotes.length === 0) {
      // If no movies have yes votes, return the highest rated movie
      return results.sort((a, b) => b.movie.voteAverage - a.movie.voteAverage)[0].movie;
    }

    // Return the movie with the highest score
    return moviesWithYesVotes[0].movie;
  }

  /**
   * Delete a voting session (only owner can delete)
   */
  async deleteSession(sessionId: string, ownerId: string): Promise<boolean> {
    const session = await VotingSessionModel.findById(sessionId);
    if (!session) {
      return false;
    }

    // Check if user is the group owner
    const group = await this.groupService.getGroupById(session.groupId);
    if (!group || group.ownerId !== ownerId) {
      return false;
    }

    await VotingSessionModel.findByIdAndDelete(sessionId);
    return true;
  }
} 