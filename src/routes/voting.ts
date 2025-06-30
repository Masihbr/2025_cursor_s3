import { Router } from 'express';
import { VotingController } from '@/controllers/votingController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { votingSchemas } from '@/schemas/voting';

const router = Router();
const votingController = new VotingController();

// Apply authentication middleware to all voting routes
router.use(authenticateToken);

// Voting session management routes
router.post('/sessions', validateRequest(votingSchemas.createSession), votingController.createSession);
router.get('/sessions/:groupId', votingController.getActiveSession);
router.put('/sessions/:sessionId/start', votingController.startSession);
router.put('/sessions/:sessionId/end', votingController.endSession);
router.delete('/sessions/:sessionId', votingController.deleteSession);

// Voting routes
router.post('/sessions/:sessionId/vote', validateRequest(votingSchemas.castVote), votingController.castVote);
router.get('/sessions/:sessionId/votes', votingController.getSessionVotes);
router.get('/sessions/:sessionId/results', votingController.getSessionResults);

// Session history
router.get('/history/:groupId', votingController.getSessionHistory);
router.get('/history/session/:sessionId', votingController.getSessionDetails);

export default router; 