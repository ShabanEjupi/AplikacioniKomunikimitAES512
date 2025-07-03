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
  console.log('🔍 Login function called:', event.httpMethod, event.path);
  console.log('Headers:', event.headers);
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
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
    console.log('📤 Processing login request...');
    console.log('Body:', event.body);
    
    const { username, password } = JSON.parse(event.body);
    console.log('🔐 Login attempt for username:', username);

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    // Find user
    const user = users.get(username);
    console.log('👤 User found:', !!user);
    console.log('Available users:', Array.from(users.keys()));
    
    if (!user) {
      console.log('❌ User not found:', username);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Verify password
    const hashedPassword = hash(password);
    console.log('🔒 Password verification...');
    
    if (user.password !== hashedPassword) {
      console.log('❌ Password mismatch');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Generate token (simplified for demo)
    const token = Buffer.from(`${user.userId}:${username}:${Date.now()}`).toString('base64');
    console.log('✅ Login successful for user:', username);

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
    console.error('❌ Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};
