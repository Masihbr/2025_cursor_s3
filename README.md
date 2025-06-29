# MovieSwipe Backend

A Node.js backend for MovieSwipe - A movie recommendation app for groups that helps friends, families, or coworkers find movies everyone will enjoy through interactive swiping and intelligent recommendation algorithms.

## Features

- **Group Management**: Create, join, and manage groups with invitation codes
- **Google OAuth Authentication**: Secure user authentication using Google
- **Real-time Voting**: Interactive swiping mechanism with WebSocket support
- **Intelligent Movie Recommendations**: Algorithm that considers group preferences
- **TMDB Integration**: External movie database API for movie data
- **Real-time Notifications**: Push notifications and live updates

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Google OAuth 2.0 with Passport.js
- **Real-time**: Socket.IO for WebSocket connections
- **External APIs**: TMDB (The Movie Database) API
- **Security**: Helmet, CORS, Rate limiting
- **Deployment**: Azure Cloud

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Google OAuth credentials
- TMDB API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/movieswipe
   JWT_SECRET=your-super-secret-jwt-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   TMDB_API_KEY=your-tmdb-api-key
   FRONTEND_URL=http://localhost:3001
   ```

4. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout

### Groups
- `POST /api/groups` - Create a new group
- `GET /api/groups` - Get user's groups
- `GET /api/groups/:groupId` - Get specific group
- `POST /api/groups/join` - Join group with invitation code
- `DELETE /api/groups/:groupId/leave` - Leave group
- `DELETE /api/groups/:groupId` - Delete group (owner only)
- `GET /api/groups/:groupId/invitation` - Get invitation code

### Movies
- `GET /api/movies/recommendations/:groupId` - Get movie recommendations
- `GET /api/movies/:movieId` - Get movie details
- `GET /api/movies/search` - Search movies
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/genre/:genreId` - Get movies by genre

### Voting
- `POST /api/voting/sessions` - Start voting session
- `PUT /api/voting/sessions/:sessionId/end` - End voting session
- `POST /api/voting/sessions/:sessionId/votes` - Submit vote
- `GET /api/voting/sessions/:sessionId/results` - Get voting results
- `GET /api/voting/sessions/group/:groupId` - Get current session
- `GET /api/voting/sessions/:sessionId/votes` - Get user votes

## WebSocket Events

### Client to Server
- `join-group` - Join a group room
- `leave-group` - Leave a group room
- `vote` - Submit a vote
- `voting-session-start` - Start voting session
- `voting-session-end` - End voting session
- `group-updated` - Notify group updates

### Server to Client
- `user-joined` - User joined group
- `user-left` - User left group
- `vote-received` - Vote received from user
- `voting-session-started` - Voting session started
- `voting-session-ended` - Voting session ended with results
- `group-updated` - Group was updated
- `user-disconnected` - User disconnected

## Project Structure

```
src/
├── config/
│   ├── database.ts      # MongoDB connection
│   └── socket.ts        # Socket.IO configuration
├── middleware/
│   ├── errorHandler.ts  # Error handling middleware
│   └── notFound.ts      # 404 handler
├── models/              # MongoDB models
├── routes/
│   ├── auth.ts          # Authentication routes
│   ├── groups.ts        # Group management routes
│   ├── movies.ts        # Movie-related routes
│   └── voting.ts        # Voting session routes
├── services/            # Business logic
├── utils/
│   └── auth.ts          # Authentication utilities
└── index.ts             # Main application entry
```

## Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Code Style
The project uses ESLint with TypeScript rules. Run `npm run lint` to check for issues and `npm run lint:fix` to automatically fix them.

## Deployment

### Azure Deployment
1. Set up Azure App Service
2. Configure environment variables in Azure
3. Deploy using Azure CLI or GitHub Actions
4. Set up MongoDB Atlas or Azure Cosmos DB

### Environment Variables for Production
- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - Strong secret key
- `GOOGLE_CLIENT_ID` - Production Google OAuth credentials
- `GOOGLE_CLIENT_SECRET` - Production Google OAuth credentials
- `TMDB_API_KEY` - TMDB API key
- `FRONTEND_URL` - Production frontend URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 