import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { VotingSessionService } from '../services/votingSessionService';
import { MovieRecommendationService } from '../services/movieRecommendationService';
import { IUser } from '../models/User';

const router = express.Router();

// Create a new voting session
router.post('/sessions', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId, settings } = req.body;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    const session = await VotingSessionService.createVotingSession({
      groupId,
      createdBy: userId,
      settings
    });

    return res.status(201).json({
      success: true,
      data: {
        id: session._id,
        groupId: session.groupId,
        createdBy: session.createdBy,
        status: session.status,
        movieRecommendations: session.movieRecommendations,
        settings: session.settings,
        startedAt: session.startedAt,
        createdAt: session.createdAt
      },
      message: 'Voting session created successfully'
    });
  } catch (error) {
    console.error('Error creating voting session:', error);
    if (error instanceof Error) {
      if (error.message === 'Group not found or inactive') {
        return res.status(404).json({
          success: false,
          error: 'Group not found or inactive'
        });
      }
      if (error.message === 'Only group owner can create voting sessions') {
        return res.status(403).json({
          success: false,
          error: 'Only group owner can create voting sessions'
        });
      }
      if (error.message === 'There is already an active voting session for this group') {
        return res.status(409).json({
          success: false,
          error: 'There is already an active voting session for this group'
        });
      }
      if (error.message === 'All group members must set their genre preferences before starting a voting session') {
        return res.status(400).json({
          success: false,
          error: 'All group members must set their genre preferences before starting a voting session'
        });
      }
      if (error.message === 'No movie recommendations available for this group') {
        return res.status(400).json({
          success: false,
          error: 'No movie recommendations available for this group'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to create voting session'
    });
  }
});

// Get active voting session for a group
router.get('/sessions/group/:groupId', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    const session = await VotingSessionService.getActiveVotingSession(groupId, userId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'No active voting session found for this group'
      });
    }

    return res.json({
      success: true,
      data: {
        id: session._id,
        groupId: session.groupId,
        createdBy: session.createdBy,
        status: session.status,
        movieRecommendations: session.movieRecommendations,
        settings: session.settings,
        memberVoteCounts: session.memberVoteCounts,
        startedAt: session.startedAt,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting active voting session:', error);
    if (error instanceof Error && error.message === 'Access denied to this voting session') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this voting session'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get voting session'
    });
  }
});

// Get specific voting session
router.get('/sessions/:sessionId', authenticateToken, async (req: express.Request, res) => {
  try {
    const { sessionId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const session = await VotingSessionService.getVotingSession(sessionId, userId);

    return res.json({
      success: true,
      data: {
        id: session._id,
        groupId: session.groupId,
        createdBy: session.createdBy,
        status: session.status,
        movieRecommendations: session.movieRecommendations,
        votes: session.votes,
        results: session.results,
        settings: session.settings,
        memberVoteCounts: session.memberVoteCounts,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Error getting voting session:', error);
    if (error instanceof Error) {
      if (error.message === 'Voting session not found') {
        return res.status(404).json({
          success: false,
          error: 'Voting session not found'
        });
      }
      if (error.message === 'Access denied to this voting session') {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this voting session'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get voting session'
    });
  }
});

// Submit a vote
router.post('/sessions/:sessionId/vote', authenticateToken, async (req: express.Request, res) => {
  try {
    const { sessionId } = req.params;
    const { movieId, vote } = req.body;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    if (!movieId || !vote) {
      return res.status(400).json({
        success: false,
        error: 'Movie ID and vote are required'
      });
    }

    if (!['like', 'dislike', 'neutral'].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: 'Vote must be like, dislike, or neutral'
      });
    }

    await VotingSessionService.submitVote(sessionId, {
      userId,
      movieId,
      vote
    });

    return res.json({
      success: true,
      message: 'Vote submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    if (error instanceof Error) {
      if (error.message === 'Voting session not found') {
        return res.status(404).json({
          success: false,
          error: 'Voting session not found'
        });
      }
      if (error.message === 'Voting session is not active') {
        return res.status(400).json({
          success: false,
          error: 'Voting session is not active'
        });
      }
      if (error.message === 'Only group members can vote') {
        return res.status(403).json({
          success: false,
          error: 'Only group members can vote'
        });
      }
      if (error.message === 'Invalid movie for this voting session') {
        return res.status(400).json({
          success: false,
          error: 'Invalid movie for this voting session'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to submit vote'
    });
  }
});

// Get user's votes for a session
router.get('/sessions/:sessionId/votes', authenticateToken, async (req: express.Request, res) => {
  try {
    const { sessionId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const votes = await VotingSessionService.getUserVotes(sessionId, userId);

    return res.json({
      success: true,
      data: votes
    });
  } catch (error) {
    console.error('Error getting user votes:', error);
    if (error instanceof Error && error.message === 'Voting session not found') {
      return res.status(404).json({
        success: false,
        error: 'Voting session not found'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get user votes'
    });
  }
});

// Complete voting session
router.post('/sessions/:sessionId/complete', authenticateToken, async (req: express.Request, res) => {
  try {
    const { sessionId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const session = await VotingSessionService.completeVotingSession(sessionId, userId);

    return res.json({
      success: true,
      data: {
        id: session._id,
        status: session.status,
        results: session.results,
        endedAt: session.endedAt
      },
      message: 'Voting session completed successfully'
    });
  } catch (error) {
    console.error('Error completing voting session:', error);
    if (error instanceof Error) {
      if (error.message === 'Voting session not found') {
        return res.status(404).json({
          success: false,
          error: 'Voting session not found'
        });
      }
      if (error.message === 'Only session creator can complete the voting session') {
        return res.status(403).json({
          success: false,
          error: 'Only session creator can complete the voting session'
        });
      }
      if (error.message === 'Voting session is already completed or cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Voting session is already completed or cancelled'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to complete voting session'
    });
  }
});

// Cancel voting session
router.post('/sessions/:sessionId/cancel', authenticateToken, async (req: express.Request, res) => {
  try {
    const { sessionId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const session = await VotingSessionService.cancelVotingSession(sessionId, userId);

    return res.json({
      success: true,
      data: {
        id: session._id,
        status: session.status,
        endedAt: session.endedAt
      },
      message: 'Voting session cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling voting session:', error);
    if (error instanceof Error) {
      if (error.message === 'Voting session not found') {
        return res.status(404).json({
          success: false,
          error: 'Voting session not found'
        });
      }
      if (error.message === 'Only session creator can cancel the voting session') {
        return res.status(403).json({
          success: false,
          error: 'Only session creator can cancel the voting session'
        });
      }
      if (error.message === 'Voting session is already completed or cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Voting session is already completed or cancelled'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel voting session'
    });
  }
});

// Get voting history for a group
router.get('/sessions/group/:groupId/history', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    const sessions = await VotingSessionService.getVotingHistory(groupId, userId);

    return res.json({
      success: true,
      data: sessions.map(session => ({
        id: session._id,
        groupId: session.groupId,
        createdBy: session.createdBy,
        status: session.status,
        settings: session.settings,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error getting voting history:', error);
    if (error instanceof Error && error.message === 'Access denied to group voting history') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to group voting history'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get voting history'
    });
  }
});

// Get voting statistics
router.get('/sessions/:sessionId/stats', authenticateToken, async (req: express.Request, res) => {
  try {
    const { sessionId } = req.params;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const stats = await VotingSessionService.getVotingStats(sessionId);

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting voting stats:', error);
    if (error instanceof Error) {
      if (error.message === 'Voting session not found') {
        return res.status(404).json({
          success: false,
          error: 'Voting session not found'
        });
      }
      if (error.message === 'Group not found') {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get voting statistics'
    });
  }
});

// Get movie recommendations for a group (without creating session)
router.get('/recommendations/:groupId', authenticateToken, async (req: express.Request, res) => {
  try {
    const { groupId } = req.params;
    const { maxRecommendations = 10 } = req.query;
    const user = (req as any).user as IUser;
    const userId = (user._id as any).toString();

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required'
      });
    }

    const recommendations = await MovieRecommendationService.generateRecommendations(
      groupId,
      Number(maxRecommendations)
    );

    return res.json({
      success: true,
      data: {
        groupId,
        recommendations,
        totalRecommendations: recommendations.length
      }
    });
  } catch (error) {
    console.error('Error getting movie recommendations:', error);
    if (error instanceof Error) {
      if (error.message === 'No group members have set preferences yet') {
        return res.status(400).json({
          success: false,
          error: 'No group members have set preferences yet'
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to get movie recommendations'
    });
  }
});

export default router; 