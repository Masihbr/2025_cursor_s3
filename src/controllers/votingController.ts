import { Request, Response } from 'express';
import { VotingService } from '@/services/votingService';

const votingService = new VotingService();

export class VotingController {
  /**
   * POST /api/voting/sessions
   * Create a new voting session for a group
   */
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.body;
      const userId = (req as any).user.id;

      if (!groupId) {
        res.status(400).json({
          success: false,
          error: 'Group ID is required'
        });
        return;
      }

      const session = await votingService.createSession(groupId, userId);
      
      res.status(201).json({
        success: true,
        data: {
          id: (session as any)._id,
          groupId: session.groupId,
          status: session.status,
          movies: session.movies,
          votes: session.votes,
          startTime: session.startTime,
          endTime: session.endTime,
          selectedMovie: session.selectedMovie,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }
      });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create voting session'
      });
    }
  }

  /**
   * GET /api/voting/sessions/active/:groupId
   * Get active voting session for a group
   */
  async getActiveSession(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user.id;

      const session = await votingService.getActiveSession(groupId);
      
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'No active voting session found for this group'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: (session as any)._id,
          groupId: session.groupId,
          status: session.status,
          movies: session.movies,
          votes: session.votes,
          startTime: session.startTime,
          endTime: session.endTime,
          selectedMovie: session.selectedMovie,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }
      });
    } catch (error) {
      console.error('Get active session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active session'
      });
    }
  }

  /**
   * POST /api/voting/sessions/:sessionId/start
   * Start a voting session
   */
  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user.id;

      const session = await votingService.startSession(sessionId, userId);
      
      res.status(200).json({
        success: true,
        data: {
          id: (session as any)._id,
          groupId: session.groupId,
          status: session.status,
          movies: session.movies,
          votes: session.votes,
          startTime: session.startTime,
          endTime: session.endTime,
          selectedMovie: session.selectedMovie,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        },
        message: 'Voting session started successfully'
      });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start voting session'
      });
    }
  }

  /**
   * POST /api/voting/sessions/:sessionId/end
   * End a voting session and select winning movie
   */
  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user.id;

      const session = await votingService.endSession(sessionId, userId);
      
      res.status(200).json({
        success: true,
        data: {
          id: (session as any)._id,
          groupId: session.groupId,
          status: session.status,
          movies: session.movies,
          votes: session.votes,
          startTime: session.startTime,
          endTime: session.endTime,
          selectedMovie: session.selectedMovie,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        },
        message: 'Voting session ended successfully'
      });
    } catch (error) {
      console.error('End session error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end voting session'
      });
    }
  }

  /**
   * DELETE /api/voting/sessions/:sessionId
   * Delete a voting session
   */
  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user.id;

      const success = await votingService.deleteSession(sessionId, userId);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Voting session not found or you are not the group owner'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Voting session deleted successfully'
      });
    } catch (error) {
      console.error('Delete session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete voting session'
      });
    }
  }

  /**
   * POST /api/voting/sessions/:sessionId/votes
   * Cast a vote for a movie
   */
  async castVote(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { movieId, vote } = req.body;
      const userId = (req as any).user.id;

      if (!movieId || !vote || !['yes', 'no'].includes(vote)) {
        res.status(400).json({
          success: false,
          error: 'Movie ID and vote (yes/no) are required'
        });
        return;
      }

      await votingService.castVote(sessionId, userId, movieId, vote);
      
      res.status(200).json({
        success: true,
        message: 'Vote cast successfully'
      });
    } catch (error) {
      console.error('Cast vote error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cast vote'
      });
    }
  }

  /**
   * GET /api/voting/sessions/:sessionId/votes
   * Get all votes for a session
   */
  async getSessionVotes(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const votes = await votingService.getSessionVotes(sessionId);
      
      res.status(200).json({
        success: true,
        data: votes
      });
    } catch (error) {
      console.error('Get session votes error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch session votes'
      });
    }
  }

  /**
   * GET /api/voting/sessions/:sessionId/results
   * Get voting results for a session
   */
  async getSessionResults(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await votingService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Voting session not found'
        });
        return;
      }

      if (session.status !== 'completed') {
        res.status(400).json({
          success: false,
          error: 'Voting session is not completed yet'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          sessionId: (session as any)._id,
          groupId: session.groupId,
          selectedMovie: session.selectedMovie,
          totalVotes: session.votes.length,
          endTime: session.endTime
        }
      });
    } catch (error) {
      console.error('Get session results error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session results'
      });
    }
  }

  /**
   * GET /api/voting/sessions/history/:groupId
   * Get voting session history for a group
   */
  async getSessionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;

      const sessions = await votingService.getSessionHistory(groupId);
      
      res.status(200).json({
        success: true,
        data: sessions.map(session => ({
          id: (session as any)._id,
          groupId: session.groupId,
          status: session.status,
          movies: session.movies,
          votes: session.votes,
          startTime: session.startTime,
          endTime: session.endTime,
          selectedMovie: session.selectedMovie,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }))
      });
    } catch (error) {
      console.error('Get session history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session history'
      });
    }
  }

  /**
   * GET /api/voting/sessions/:sessionId
   * Get voting session details
   */
  async getSessionDetails(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await votingService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Voting session not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: (session as any)._id,
          groupId: session.groupId,
          status: session.status,
          movies: session.movies,
          votes: session.votes,
          startTime: session.startTime,
          endTime: session.endTime,
          selectedMovie: session.selectedMovie,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }
      });
    } catch (error) {
      console.error('Get session details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session details'
      });
    }
  }
} 