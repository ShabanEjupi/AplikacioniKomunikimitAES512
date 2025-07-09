// Simple users function
const crypto = require('crypto');

// In-memory user storage (same as other functions)
let users = new Map();

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Initialize with test users
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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Return list of users (without passwords)
    const userList = Array.from(users.values()).map(user => ({
      username: user.username,
      userId: user.userId
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        users: userList,
        count: userList.length
      })
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
