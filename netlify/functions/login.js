const { hash } = require('../../shared/src/crypto/ash512-impl.js');

// In-memory user storage (same as register.js)
let users = new Map();

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

    // Find user
    const user = users.get(username);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Verify password
    const hashedPassword = hash(password);
    if (user.password !== hashedPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Generate token (simplified for demo)
    const token = Buffer.from(`${user.userId}:${username}:${Date.now()}`).toString('base64');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        userId: user.userId,
        username: user.username
      })
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
