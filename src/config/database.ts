import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: 'mysql' | 'mongodb';
  logging: boolean;
}

export const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '27017'),
  username: process.env.DB_USERNAME || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movieswipe',
  dialect: (process.env.DB_DIALECT as 'mysql' | 'mongodb') || 'mongodb',
  logging: process.env.NODE_ENV === 'development'
};

export const getDatabaseUrl = (): string => {
  if (databaseConfig.dialect === 'mongodb') {
    return process.env.MONGODB_URI || `mongodb://${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`;
  }
  return `mysql://${databaseConfig.username}:${databaseConfig.password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`;
}; 