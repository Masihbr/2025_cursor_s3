import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import database service
import { databaseService } from '@/services/databaseService';

// Import routes
import authRoutes from '@/routes/auth';
import groupRoutes from '@/routes/groups';
import movieRoutes from '@/routes/movies';
import votingRoutes from '@/routes/voting';

// Import middleware
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';

// Import socket handlers
import { setupSocketHandlers } from '@/services/socketService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/voting', votingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: databaseService.getConnectionStatus() ? 'connected' : 'disconnected'
  });
});

// Setup socket handlers
setupSocketHandlers(io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await databaseService.connect();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 MovieSwipe Backend running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: MongoDB`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 