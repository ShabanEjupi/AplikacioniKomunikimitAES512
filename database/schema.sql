-- Crypto 512 Database Schema for Netlify DB (Neon PostgreSQL)

-- Users table with ASH-512 hashed passwords
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- ASH-512 hash
    user_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP
);

-- Messages table with AES-512 encrypted content
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,
    encrypted_content TEXT NOT NULL, -- AES-512 encrypted
    integrity_hash TEXT NOT NULL,    -- ASH-512 hash for integrity
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (recipient_id) REFERENCES users(user_id)
);

-- Groups table for group messaging
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_private BOOLEAN DEFAULT false,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Group members table
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(group_id, user_id)
);

-- File uploads table
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    file_id VARCHAR(255) UNIQUE NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT false,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

-- Security audit log
CREATE TABLE security_audit (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Session tokens (for security)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Insert default test users (ASH-512 hashed passwords)
INSERT INTO users (username, password_hash, user_id) VALUES 
('testuser', 'ash512:' || encode(digest('testpass123' || 'salt123', 'sha512'), 'hex'), '1001'),
('alice', 'ash512:' || encode(digest('alice123' || 'salt123', 'sha512'), 'hex'), '1002'),
('bob', 'ash512:' || encode(digest('bob123' || 'salt123', 'sha512'), 'hex'), '1003'),
('charlie', 'ash512:' || encode(digest('charlie123' || 'salt123', 'sha512'), 'hex'), '1004');
