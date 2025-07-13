// Simple users function
const crypto = require('crypto');

// In-memory user storage (shared across functions via global scope)
global.users = global.users || new Map();

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Initialize with test users if not already done
if (global.users.size === 0) {
  global.users.set('testuser', { 
    username: 'testuser', 
    password: hashPassword('testpass123'), 
    userId: '1001' 
  });
  global.users.set('alice', { 
    username: 'alice', 
    password: hashPassword('alice123'), 
    userId: '1002' 
  });
  global.users.set('bob', { 
    username: 'bob', 
    password: hashPassword('bob123'), 
    userId: '1003' 
  });
  global.users.set('charlie', { 
    username: 'charlie', 
    password: hashPassword('charlie123'), 
    userId: '1004' 
  });
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Return list of users (without passwords)
    const userList = Array.from(global.users.values()).map(user => ({
      username: user.username,
      userId: user.userId,
      online: Math.random() > 0.5 // Random online status for demo
    }));

    // Return as direct array for compatibility
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(userList)
    };

  } catch (error) {
    console.error('Users error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
