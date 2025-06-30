# MovieSwipe Backend

A TypeScript-based backend API for MovieSwipe, a movie recommendation app that helps groups find movies everyone will enjoy through intelligent preference matching and interactive voting.

## 🎬 Project Overview

MovieSwipe is designed for groups of friends, families, or coworkers who want to watch movies together but struggle to find a movie that everyone would enjoy due to different genre preferences. The app uses an intelligent recommendation algorithm that prioritizes common genre preferences while considering individual preferences.

## 🚀 Features

### Core Functionality
- **Group Management**: Create groups, invite members, manage preferences
- **Smart Recommendations**: Intelligent algorithm based on group and individual preferences
- **Interactive Voting**: Real-time swiping mechanism for movie voting
- **Real-time Communication**: WebSocket-based live updates during voting sessions
- **Push Notifications**: Firebase integration for session updates

### Technical Features
- **Authentication**: JWT-based auth with Google/Facebook OAuth support
- **External APIs**: TMDB (The Movie Database) integration for movie data
- **Real-time Events**: Socket.IO for live voting and session management
- **Cloud Deployment**: Azure-ready configuration
- **Database Support**: MySQL and MongoDB options

## 🏗️ Project Structure

```
src/
├── config/           # Configuration files
│   ├── app.ts       # Application configuration
│   └── database.ts  # Database configuration
├── controllers/     # Route controllers
│   ├── authController.ts
│   ├── groupController.ts
│   ├── movieController.ts
│   └── votingController.ts
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication middleware
│   ├── errorHandler.ts
│   └── validation.ts
├── models/          # Data models
│   ├── User.ts
│   ├── Group.ts
│   ├── Movie.ts
│   └── VotingSession.ts
├── routes/          # API routes
│   ├── auth.ts
│   ├── groups.ts
│   ├── movies.ts
│   └── voting.ts
├── services/        # Business logic services
│   ├── movieRecommendationService.ts
│   ├── tmdbService.ts
│   ├── socketService.ts
│   └── notificationService.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL/MongoDB
- **Authentication**: JWT + OAuth (Google/Facebook)
- **Real-time**: Socket.IO
- **External APIs**: TMDB (The Movie Database)
- **Push Notifications**: Firebase
- **Cloud Platform**: Azure
- **Testing**: Jest
- **Linting**: ESLint

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- MySQL or MongoDB database
- TMDB API key
- Google/Facebook OAuth credentials (optional)
- Firebase project (for push notifications)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   - For MySQL: Create a database named `movieswipe`
   - For MongoDB: Ensure MongoDB is running locally or update connection string

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure the following:

- **Database**: Choose between MySQL or MongoDB
- **Authentication**: Set up JWT secret and OAuth credentials
- **External APIs**: Configure TMDB API key
- **Firebase**: Set up for push notifications
- **Azure**: Configure for deployment

### Database Setup

The project supports both MySQL and MongoDB:

**MySQL:**
```sql
CREATE DATABASE movieswipe;
```

**MongoDB:**
```bash
# Start MongoDB service
mongod
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/facebook` - Facebook OAuth

### Group Management
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `POST /api/groups/join` - Join group with invite code
- `PUT /api/groups/:id/preferences` - Update preferences

### Movie Recommendations
- `GET /api/movies/recommendations/:groupId` - Get group recommendations
- `GET /api/movies/search` - Search movies
- `GET /api/movies/popular` - Get popular movies

### Voting Sessions
- `POST /api/voting/sessions` - Create voting session
- `PUT /api/voting/sessions/:id/start` - Start session
- `POST /api/voting/sessions/:id/vote` - Cast vote
- `PUT /api/voting/sessions/:id/end` - End session

## 🔌 Real-time Events

The application uses Socket.IO for real-time communication:

### Client Events
- `authenticate` - Authenticate user
- `group:join` - Join group room
- `vote:cast` - Cast vote in session
- `session:start` - Start voting session
- `session:end` - End voting session

### Server Events
- `vote:cast` - Vote cast by user
- `session:started` - Session started
- `session:ended` - Session ended with results

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Azure Deployment

1. **Install Azure CLI**
2. **Login to Azure**
   ```bash
   az login
   ```

3. **Deploy to Azure App Service**
   ```bash
   az webapp up --name movieswipe-backend --resource-group your-resource-group
   ```

### Environment Variables for Production

Ensure all production environment variables are set in Azure App Service configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔮 Future Enhancements

- [ ] Advanced recommendation algorithms
- [ ] Movie watch history tracking
- [ ] Social features (reviews, ratings)
- [ ] Integration with streaming services
- [ ] Mobile app companion
- [ ] Analytics dashboard 