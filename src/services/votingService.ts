import { VotingSessionModel, IVotingSession } from '@/models/VotingSession';
import { MovieRecommendationService } from './movieRecommendationService';
import { Vote, Movie } from '@/types';

export class VotingService {
  private movieRecommendationService: MovieRecommendationService;

  constructor() {
    this.movieRecommendationService = new MovieRecommendationService();
  }

  async createSession(groupId: string, movieCount: number = 20): Promise<IVotingSession> {
    // Get movie recommendations for the group
    const recommendations = await this.movieRecommendationService.getGroupRecommendations(groupId, movieCount);
    const movies = recommendations.map(rec => rec.movie);

    const session = new VotingSessionModel({
      groupId,
      status: 'pending',
      movies,
      votes: []
    });

    return await session.save();
  }

  async getSessionById(sessionId: string): Promise<IVotingSession | null> {
    return await VotingSessionModel.findById(sessionId);
  }

  async getActiveSession(groupId: string): Promise<IVotingSession | null> {
    return await VotingSessionModel.findOne({
      groupId,
      status: { $in: ['pending', 'active'] }
    });
  }

  async startSession(sessionId: string, ownerId: string): Promise<IVotingSession | null> {
    const session = await VotingSessionModel.findById(sessionId);
    
    if (!session) {
      return null;
    }

    session.status = 'active';
    session.startTime = new Date();
    return await session.save();
  }

  async castVote(voteData: {
    sessionId: string;
    userId: string;
    movieId: number;
    vote: 'yes' | 'no';
  }): Promise<Vote> {
    const session = await VotingSessionModel.findById(voteData.sessionId);
    
    if (!session || session.status !== 'active') {
      throw new Error('Invalid session or session not active');
    }

    // Check if user already voted for this movie
    const existingVoteIndex = session.votes.findIndex(
      v => v.userId === voteData.userId && v.movieId === voteData.movieId
    );

    const vote: Vote = {
      id: Math.random().toString(36).substr(2, 9), // Simple ID generation
      sessionId: voteData.sessionId,
      userId: voteData.userId,
      movieId: voteData.movieId,
      vote: voteData.vote,
      timestamp: new Date()
    };

    if (existingVoteIndex >= 0) {
      // Update existing vote
      session.votes[existingVoteIndex] = vote;
    } else {
      // Add new vote
      session.votes.push(vote);
    }

    await session.save();
    return vote;
  }

  async endSession(sessionId: string, ownerId: string): Promise<{
    groupId: string;
    selectedMovie: Movie;
    results: any;
  } | null> {
    const session = await VotingSessionModel.findById(sessionId);
    
    if (!session || session.status !== 'active') {
      return null;
    }

    // Calculate results
    const results = this.calculateVotingResults(session);
    const selectedMovie = results.winner;

    session.status = 'completed';
    session.endTime = new Date();
    session.selectedMovie = selectedMovie;
    await session.save();

    return {
      groupId: session.groupId,
      selectedMovie,
      results
    };
  }

  private calculateVotingResults(session: IVotingSession): any {
    const movieVotes = new Map<number, { yes: number; no: number; total: number }>();

    // Initialize vote counts for all movies
    session.movies.forEach(movie => {
      movieVotes.set(movie.id, { yes: 0, no: 0, total: 0 });
    });

    // Count votes
    session.votes.forEach(vote => {
      const movieVote = movieVotes.get(vote.movieId);
      if (movieVote) {
        if (vote.vote === 'yes') {
          movieVote.yes++;
        } else {
          movieVote.no++;
        }
        movieVote.total++;
      }
    });

    // Calculate scores and find winner
    let winner: Movie | null = null;
    let highestScore = -1;

    session.movies.forEach(movie => {
      const votes = movieVotes.get(movie.id);
      if (votes && votes.total > 0) {
        const score = (votes.yes / votes.total) * 100;
        if (score > highestScore) {
          highestScore = score;
          winner = movie;
        }
      }
    });

    return {
      winner: winner || session.movies[0],
      movieResults: Array.from(movieVotes.entries()).map(([movieId, votes]) => ({
        movieId,
        yes: votes.yes,
        no: votes.no,
        total: votes.total,
        percentage: votes.total > 0 ? (votes.yes / votes.total) * 100 : 0
      })),
      totalVotes: session.votes.length
    };
  }

  async getSessionVotes(sessionId: string): Promise<Vote[]> {
    const session = await VotingSessionModel.findById(sessionId);
    return session?.votes || [];
  }

  async getSessionHistory(groupId: string): Promise<IVotingSession[]> {
    return await VotingSessionModel.find({
      groupId,
      status: 'completed'
    }).sort({ endTime: -1 });
  }
} 