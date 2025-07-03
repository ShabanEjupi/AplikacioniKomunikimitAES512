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
  console.log('🔐 Login function called:', event.httpMethod, event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const { username, password } = JSON.parse(event.body);
    console.log('📤 Login attempt for user:', username);

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    const user = users.get(username);
    if (!user) {
      console.log('❌ User not found:', username);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    const hashedPassword = hash(password);
    if (hashedPassword !== user.password) {
      console.log('❌ Invalid password for user:', username);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    console.log('✅ Login successful for user:', username);
    
    // Generate a simple token (in production, use JWT)
    const token = `token_${user.userId}_${Date.now()}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token: token,
        user: {
          username: user.username,
          userId: user.userId
        }
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
