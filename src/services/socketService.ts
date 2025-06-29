import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { VotingSession } from '../models/VotingSession';
import { VotingSessionService } from './votingSessionService';

export interface SocketUser {
  userId: string;
  socketId: string;
  groupId?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id, socket.data.user.email);

      // Join group room
      socket.on('join-group', async (groupId: string) => {
        try {
          const user = socket.data.user;
          const userInfo: SocketUser = {
            userId: user._id.toString(),
            socketId: socket.id,
            groupId
          };

          this.connectedUsers.set(socket.id, userInfo);
          socket.join(`group:${groupId}`);
          
          console.log(`User ${user.email} joined group ${groupId}`);
          
          // Emit user joined event
          socket.to(`group:${groupId}`).emit('user-joined', {
            userId: user._id,
            userName: user.name,
            userEmail: user.email
          });
        } catch (error) {
          console.error('Error joining group:', error);
          socket.emit('error', { message: 'Failed to join group' });
        }
      });

      // Handle voting
      socket.on('vote', async (data: { sessionId: string; movieId: string; vote: 'like' | 'dislike' }) => {
        try {
          const user = socket.data.user;
          const { sessionId, movieId, vote } = data;

          // Submit vote through service
          await VotingSessionService.submitVote(sessionId, {
            userId: user._id.toString(),
            movieId,
            vote
          });

          // Get updated session data
          const session = await VotingSessionService.getVotingSession(sessionId, user._id.toString());
          
          // Emit vote update to all users in the group
          const groupId = session.groupId.toString();
          this.io.to(`group:${groupId}`).emit('vote-updated', {
            sessionId,
            movieId,
            userId: user._id,
            userName: user.name,
            vote,
            timestamp: new Date(),
            sessionStats: await VotingSessionService.getVotingStats(sessionId)
          });

          // Emit session update
          this.io.to(`group:${groupId}`).emit('session-updated', {
            sessionId,
            session: {
              id: session._id,
              status: session.status,
              movieRecommendations: session.movieRecommendations,
              memberVoteCounts: session.memberVoteCounts,
              votes: session.votes
            }
          });

        } catch (error) {
          console.error('Error processing vote:', error);
          socket.emit('error', { 
            message: error instanceof Error ? error.message : 'Failed to submit vote' 
          });
        }
      });

      // Handle session completion
      socket.on('complete-session', async (sessionId: string) => {
        try {
          const user = socket.data.user;
          
          const session = await VotingSessionService.completeVotingSession(sessionId, user._id.toString());
          const groupId = session.groupId.toString();

          // Emit session completed event
          this.io.to(`group:${groupId}`).emit('session-completed', {
            sessionId,
            results: session.results,
            endedAt: session.endedAt
          });

        } catch (error) {
          console.error('Error completing session:', error);
          socket.emit('error', { 
            message: error instanceof Error ? error.message : 'Failed to complete session' 
          });
        }
      });

      // Handle session cancellation
      socket.on('cancel-session', async (sessionId: string) => {
        try {
          const user = socket.data.user;
          
          const session = await VotingSessionService.cancelVotingSession(sessionId, user._id.toString());
          const groupId = session.groupId.toString();

          // Emit session cancelled event
          this.io.to(`group:${groupId}`).emit('session-cancelled', {
            sessionId,
            endedAt: session.endedAt
          });

        } catch (error) {
          console.error('Error cancelling session:', error);
          socket.emit('error', { 
            message: error instanceof Error ? error.message : 'Failed to cancel session' 
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userInfo = this.connectedUsers.get(socket.id);
        if (userInfo) {
          console.log(`User ${userInfo.userId} disconnected from socket ${socket.id}`);
          this.connectedUsers.delete(socket.id);
          
          if (userInfo.groupId) {
            socket.to(`group:${userInfo.groupId}`).emit('user-left', {
              userId: userInfo.userId,
              socketId: socket.id
            });
          }
        }
      });
    });
  }

  // Public methods for emitting events from other services
  public emitToGroup(groupId: string, event: string, data: any) {
    this.io.to(`group:${groupId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    const userSocket = Array.from(this.connectedUsers.entries())
      .find(([_, user]) => user.userId === userId);
    
    if (userSocket) {
      this.io.to(userSocket[0]).emit(event, data);
    }
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getGroupMembers(groupId: string): SocketUser[] {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.groupId === groupId);
  }
} 