// Simple user registration function
const crypto = require('crypto');

// In-memory user storage for demo
let users = new Map();
let userIdCounter = 1000;

// Initialize with test users
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

users.set('testuser', { 
  username: 'testuser', 
  password: hashPassword('testpass123'), 
  userId: '1001' 
});
users.set('alice', { 
  username: 'alice', 
  password: hashPassword('alice123'), 
  userId: '1002' 
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
        body: JSON.stringify({ error: 'Username and password required' })
      };
    }

    if (users.has(username)) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'User already exists' })
      };
    }

    // Create new user
    const hashedPassword = hashPassword(password);
    const userId = (++userIdCounter).toString();
    
    users.set(username, {
      username,
      password: hashedPassword,
      userId
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        message: 'User registered successfully',
        userId 
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
