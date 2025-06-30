import { Server, Socket } from 'socket.io';
import { AuthenticatedRequest } from '@/middleware/auth';
import { VotingService } from './votingService';
import { NotificationService } from './notificationService';

export class SocketService {
  private io: Server;
  private votingService: VotingService;
  private notificationService: NotificationService;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private groupSockets: Map<string, Set<string>> = new Map(); // groupId -> Set of socketIds

  constructor(io: Server) {
    this.io = io;
    this.votingService = new VotingService();
    this.notificationService = new NotificationService();
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.id}`);

      // Authenticate user
      socket.on('authenticate', async (token: string) => {
        try {
          // Verify token and get user info
          const user = await this.authenticateUser(token);
          if (user) {
            socket.data.user = user;
            this.userSockets.set(user.id, socket.id);
            socket.emit('authenticated', { success: true, user });
          } else {
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
          }
        } catch (error) {
          socket.emit('authenticated', { success: false, error: 'Authentication failed' });
        }
      });

      // Join group room
      socket.on('group:join', (groupId: string) => {
        if (socket.data.user) {
          socket.join(`group:${groupId}`);
          this.addUserToGroup(groupId, socket.id);
          socket.emit('group:joined', { groupId });
        }
      });

      // Leave group room
      socket.on('group:leave', (groupId: string) => {
        socket.leave(`group:${groupId}`);
        this.removeUserFromGroup(groupId, socket.id);
        socket.emit('group:left', { groupId });
      });

      // Cast vote in voting session
      socket.on('vote:cast', async (data: { sessionId: string; movieId: number; vote: 'yes' | 'no' }) => {
        if (socket.data.user) {
          try {
            const vote = await this.votingService.castVote({
              sessionId: data.sessionId,
              userId: socket.data.user.id,
              movieId: data.movieId,
              vote: data.vote
            });

            // Broadcast vote to group
            const session = await this.votingService.getSessionById(data.sessionId);
            if (session) {
              this.io.to(`group:${session.groupId}`).emit('vote:cast', {
                userId: socket.data.user.id,
                movieId: data.movieId,
                vote: data.vote,
                timestamp: vote.timestamp
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            socket.emit('vote:error', { error: errorMessage });
          }
        }
      });

      // Start voting session
      socket.on('session:start', async (sessionId: string) => {
        if (socket.data.user) {
          try {
            const session = await this.votingService.startSession(sessionId, socket.data.user.id);
            if (session) {
              this.io.to(`group:${session.groupId}`).emit('session:started', {
                sessionId,
                movies: session.movies
              });

              // Send push notifications to group members
              await this.notificationService.notifyGroupMembers(session.groupId, 'Voting session started!');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            socket.emit('session:error', { error: errorMessage });
          }
        }
      });

      // End voting session
      socket.on('session:end', async (sessionId: string) => {
        if (socket.data.user) {
          try {
            const result = await this.votingService.endSession(sessionId, socket.data.user.id);
            if (result) {
              this.io.to(`group:${result.groupId}`).emit('session:ended', {
                sessionId,
                selectedMovie: result.selectedMovie,
                results: result.results
              });

              // Send push notifications
              await this.notificationService.notifyGroupMembers(result.groupId, 'Movie selected! Check the results.');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            socket.emit('session:error', { error: errorMessage });
          }
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        this.handleUserDisconnect(socket);
      });
    });
  }

  private async authenticateUser(token: string): Promise<any> {
    // Implement JWT verification here
    // This is a placeholder - implement actual JWT verification
    return null;
  }

  private addUserToGroup(groupId: string, socketId: string): void {
    if (!this.groupSockets.has(groupId)) {
      this.groupSockets.set(groupId, new Set());
    }
    this.groupSockets.get(groupId)!.add(socketId);
  }

  private removeUserFromGroup(groupId: string, socketId: string): void {
    const groupSockets = this.groupSockets.get(groupId);
    if (groupSockets) {
      groupSockets.delete(socketId);
      if (groupSockets.size === 0) {
        this.groupSockets.delete(groupId);
      }
    }
  }

  private handleUserDisconnect(socket: Socket): void {
    // Remove user from all groups
    for (const [groupId, socketIds] of this.groupSockets.entries()) {
      if (socketIds.has(socket.id)) {
        this.removeUserFromGroup(groupId, socket.id);
      }
    }

    // Remove user from userSockets map
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === socket.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  // Public methods for external use
  public emitToGroup(groupId: string, event: string, data: any): void {
    this.io.to(`group:${groupId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

export const setupSocketHandlers = (io: Server): void => {
  new SocketService(io);
}; 