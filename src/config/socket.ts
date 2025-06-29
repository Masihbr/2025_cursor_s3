import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/auth';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  groupId?: string;
}

export const setupSocketIO = (io: SocketIOServer): void => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = await verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join group room
    socket.on('join-group', (groupId: string) => {
      socket.join(groupId);
      socket.groupId = groupId;
      console.log(`User ${socket.userId} joined group ${groupId}`);
      
      // Notify other group members
      socket.to(groupId).emit('user-joined', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Leave group room
    socket.on('leave-group', (groupId: string) => {
      socket.leave(groupId);
      socket.groupId = undefined;
      console.log(`User ${socket.userId} left group ${groupId}`);
      
      // Notify other group members
      socket.to(groupId).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle voting actions
    socket.on('vote', (data: { movieId: string; vote: 'yes' | 'no'; groupId: string }) => {
      console.log(`User ${socket.userId} voted ${data.vote} for movie ${data.movieId} in group ${data.groupId}`);
      
      // Broadcast vote to group members
      socket.to(data.groupId).emit('vote-received', {
        userId: socket.userId,
        movieId: data.movieId,
        vote: data.vote,
        timestamp: new Date().toISOString()
      });
    });

    // Handle voting session start
    socket.on('voting-session-start', (groupId: string) => {
      console.log(`Voting session started for group ${groupId}`);
      
      socket.to(groupId).emit('voting-session-started', {
        timestamp: new Date().toISOString()
      });
    });

    // Handle voting session end
    socket.on('voting-session-end', (data: { groupId: string; selectedMovie: any }) => {
      console.log(`Voting session ended for group ${data.groupId}`);
      
      socket.to(data.groupId).emit('voting-session-ended', {
        selectedMovie: data.selectedMovie,
        timestamp: new Date().toISOString()
      });
    });

    // Handle group updates
    socket.on('group-updated', (groupId: string) => {
      socket.to(groupId).emit('group-updated', {
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      if (socket.groupId) {
        socket.to(socket.groupId).emit('user-disconnected', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}; 