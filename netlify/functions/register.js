// Registration function for Netlify
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body || '{}');

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Username and password are required' 
        })
      };
    }

    // Check if username is too short
    if (username.length < 3) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Username must be at least 3 characters long' 
        })
      };
    }

    // Check if password is too short
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        })
      };
    }

    // Check if user already exists
    if (global.users.has(username)) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Username already exists' 
        })
      };
    }

    // Generate new user ID
    const userId = (1000 + global.users.size + 1).toString();

    // Create new user
    const newUser = {
      username: username,
      password: hashPassword(password),
      userId: userId
    };

    // Store user
    global.users.set(username, newUser);

    // Registration successful
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        success: true, 
        user: {
          username: newUser.username,
          userId: newUser.userId
        },
        message: 'Registration successful' 
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      })
    };
  }
};
