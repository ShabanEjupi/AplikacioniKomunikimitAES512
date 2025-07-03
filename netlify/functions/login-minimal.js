// Simple crypto function using Node.js built-in crypto
const crypto = require('crypto');

function simpleHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// In-memory user storage
const users = new Map([
  ['testuser', { 
    username: 'testuser', 
    password: simpleHash('testpass123'), 
    userId: '1001' 
  }],
  ['alice', { 
    username: 'alice', 
    password: simpleHash('alice123'), 
    userId: '1002' 
  }],
  ['bob', { 
    username: 'bob', 
    password: simpleHash('bob123'), 
    userId: '1003' 
  }],
  ['charlie', { 
    username: 'charlie', 
    password: simpleHash('charlie123'), 
    userId: '1004' 
  }]
]);

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
      body: JSON.stringify({ 
        error: 'Method not allowed',
        allowedMethods: ['POST'],
        receivedMethod: event.httpMethod
      })
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

    const hashedPassword = simpleHash(password);
    if (hashedPassword !== user.password) {
      console.log('❌ Invalid password for user:', username);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    console.log('✅ Login successful for user:', username);
    
    // Generate a simple token
    const token = `token_${user.userId}_${Date.now()}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token: token,
        user: {
          username: user.username,
          userId: user.userId
        },
        timestamp: new Date().toISOString(),
        functionName: 'login-minimal'
      })
    };

  } catch (error) {
    console.error('❌ Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error: ' + error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
