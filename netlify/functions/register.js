const { hash } = require('../../shared/src/crypto/ash512-impl.js');

// In-memory user storage for demo (use database in production)
let users = new Map();
let userIdCounter = 1000;

// Initialize with test users
users.set('testuser', { 
  username: 'testuser', 
  password: hash('testpass123'), 
  userId: '1001' 
});
users.set('alice', { 
  username: 'alice', 
  password: hash('alice123'), 
  userId: '1002' 
});
users.set('bob', { 
  username: 'bob', 
  password: hash('bob123'), 
  userId: '1003' 
});
users.set('charlie', { 
  username: 'charlie', 
  password: hash('charlie123'), 
  userId: '1004' 
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    // Check if user already exists
    if (users.has(username)) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'User already exists' })
      };
    }

    // Create new user
    const userId = (++userIdCounter).toString();
    const hashedPassword = hash(password);
    
    users.set(username, {
      username,
      password: hashedPassword,
      userId
    });

    // Generate token (simplified for demo)
    const token = Buffer.from(`${userId}:${username}:${Date.now()}`).toString('base64');

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User registered successfully',
        token,
        userId,
        username
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
