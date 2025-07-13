// Login function for Netlify
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
  console.log('🔐 Login function called:', event.httpMethod, event.path);
  console.log('👥 Available users count:', global.users.size);
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body || '{}');
    console.log('🔍 Login attempt for username:', username);

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Username and password are required' 
        })
      };
    }

    // Find user
    const user = global.users.get(username);
    
    if (!user) {
      console.log('❌ User not found:', username);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid username or password' 
        })
      };
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      console.log('❌ Invalid password for user:', username);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid username or password' 
        })
      };
    }

    // Generate a Base64 token as per the app's auth pattern (userId:username)
    const tokenData = `${user.userId}:${user.username}`;
    const token = Buffer.from(tokenData).toString('base64');

    console.log('✅ Login successful for user:', user.username, 'with userId:', user.userId);

    // Login successful
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        user: {
          username: user.username,
          userId: user.userId
        },
        token: token,
        message: 'Login successful' 
      })
    };

  } catch (error) {
    console.error('Login error:', error);
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
