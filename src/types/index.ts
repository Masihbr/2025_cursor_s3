// User related types
export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  preferences: GenrePreference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GenrePreference {
  genreId: number;
  genreName: string;
  weight: number; // 1-10 scale
}

// Group related types
export interface Group {
  id: string;
  name: string;
  ownerId: string;
  invitationCode: string;
  members: GroupMember[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  userId: string;
  joinedAt: Date;
  preferences: GenrePreference[];
}

// Movie related types
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate: string;
  genres: MovieGenre[];
  voteAverage: number;
  voteCount: number;
  runtime?: number;
  tagline?: string;
}

export interface MovieGenre {
  id: number;
  name: string;
}

// Voting session types
export interface VotingSession {
  id: string;
  groupId: string;
  status: 'pending' | 'active' | 'completed';
  movies: Movie[];
  votes: Vote[];
  startTime: Date;
  endTime?: Date;
  selectedMovie?: Movie;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  sessionId: string;
  userId: string;
  movieId: number;
  vote: 'yes' | 'no';
  timestamp: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  token: string;
}

export interface FacebookAuthRequest {
  token: string;
}

// Socket event types
export interface SocketEvents {
  'user:join': (userId: string) => void;
  'user:leave': (userId: string) => void;
  'group:join': (groupId: string) => void;
  'group:leave': (groupId: string) => void;
  'vote:cast': (vote: Omit<Vote, 'id' | 'timestamp'>) => void;
  'session:start': (sessionId: string) => void;
  'session:end': (sessionId: string, selectedMovie: Movie) => void;
  'movie:swipe': (movieId: number, vote: 'yes' | 'no') => void;
}

// Recommendation algorithm types
export interface MovieRecommendation {
  movie: Movie;
  score: number;
  reasons: string[];
}

export interface GroupPreferences {
  groupId: string;
  commonGenres: GenrePreference[];
  individualPreferences: Map<string, GenrePreference[]>;
}

// External API types
export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  runtime?: number;
  tagline?: string;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBResponse<T> {
  results: T[];
  page: number;
  total_results: number;
  total_pages: number;
}

// JWT payload type for authentication
export interface JwtPayload {
  id: string;
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
} 