import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  googleClientId: string;
  googleClientSecret: string;
  facebookAppId: string;
  facebookAppSecret: string;
  tmdbApiKey: string;
  tmdbBaseUrl: string;
  firebaseProjectId: string;
  firebasePrivateKey: string;
  firebaseClientEmail: string;
}

export const appConfig: AppConfig = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  facebookAppId: process.env.FACEBOOK_APP_ID || '',
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET || '',
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  tmdbBaseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || ''
};

export const isDevelopment = appConfig.nodeEnv === 'development';
export const isProduction = appConfig.nodeEnv === 'production'; 