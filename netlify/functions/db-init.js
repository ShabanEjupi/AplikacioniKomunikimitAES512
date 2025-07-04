// Database initialization for Neon PostgreSQL
const { neon } = require('@neondatabase/serverless');

// Initialize database connection
function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL or NETLIFY_DATABASE_URL environment variable not set');
    throw new Error('Database URL not configured');
  }
  
  console.log('🔗 Using database URL:', databaseUrl.substring(0, 50) + '...');
  return neon(databaseUrl);
}

// Initialize database tables
async function initializeDatabase() {
  const sql = getDatabase();
  
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        user_id VARCHAR(20) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add missing columns if they don't exist (for existing databases)
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `;
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
    `;

    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(36) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        sender_id VARCHAR(20) NOT NULL,
        recipient_id VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(user_id),
        FOREIGN KEY (recipient_id) REFERENCES users(user_id)
      )
    `;

    // Create index for faster message queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_participants 
      ON messages(sender_id, recipient_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_created 
      ON messages(created_at)
    `;

    console.log('✅ Database tables initialized');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Insert default users
async function insertDefaultUsers() {
  const sql = getDatabase();
  const { hash } = require('../../shared/src/crypto/ash512-impl.js');
  
  const defaultUsers = [
    { username: 'testuser', password: 'testpass123', userId: '1001' },
    { username: 'alice', password: 'alice123', userId: '1002' },
    { username: 'bob', password: 'bob123', userId: '1003' },
    { username: 'charlie', password: 'charlie123', userId: '1004' }
  ];

  try {
    for (const user of defaultUsers) {
      const passwordHash = hash(user.password);
      
      // Insert user if not exists
      await sql`
        INSERT INTO users (username, password_hash, user_id) 
        VALUES (${user.username}, ${passwordHash}, ${user.userId})
        ON CONFLICT (username) DO NOTHING
      `;
    }
    
    console.log('✅ Default users inserted');
    return true;
  } catch (error) {
    console.error('❌ Failed to insert default users:', error);
    throw error;
  }
}

module.exports = {
  getDatabase,
  initializeDatabase,
  insertDefaultUsers
};
