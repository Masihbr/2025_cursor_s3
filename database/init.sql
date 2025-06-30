-- MovieSwipe Database Initialization Script

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS movieswipe;
USE movieswipe;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    invitation_code VARCHAR(8) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_user (group_id, user_id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    group_id VARCHAR(36) NOT NULL,
    genre_id INT NOT NULL,
    genre_name VARCHAR(100) NOT NULL,
    weight INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_group_genre (user_id, group_id, genre_id)
);

-- Voting sessions table
CREATE TABLE IF NOT EXISTS voting_sessions (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'active', 'completed') DEFAULT 'pending',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    selected_movie_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Session movies table
CREATE TABLE IF NOT EXISTS session_movies (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    movie_id INT NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    movie_overview TEXT,
    movie_poster_path VARCHAR(500),
    movie_backdrop_path VARCHAR(500),
    movie_release_date DATE,
    movie_vote_average DECIMAL(3,1),
    movie_vote_count INT,
    movie_runtime INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES voting_sessions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_movie (session_id, movie_id)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    movie_id INT NOT NULL,
    vote ENUM('yes', 'no') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES voting_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_session_movie (user_id, session_id, movie_id)
);

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    movie_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_movie (user_id, movie_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_groups_owner ON groups(owner_id);
CREATE INDEX idx_groups_invitation_code ON groups(invitation_code);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_group ON user_preferences(group_id);
CREATE INDEX idx_voting_sessions_group ON voting_sessions(group_id);
CREATE INDEX idx_voting_sessions_status ON voting_sessions(status);
CREATE INDEX idx_session_movies_session ON session_movies(session_id);
CREATE INDEX idx_votes_session ON votes(session_id);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);

-- Insert sample data (optional)
INSERT IGNORE INTO users (id, email, name) VALUES 
('1', 'admin@movieswipe.com', 'Admin User');

-- Insert sample genres
INSERT IGNORE INTO user_preferences (id, user_id, group_id, genre_id, genre_name, weight) VALUES 
('1', '1', '1', 28, 'Action', 8),
('2', '1', '1', 12, 'Adventure', 7),
('3', '1', '1', 16, 'Animation', 6); 