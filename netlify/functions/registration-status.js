// Simple registration status without database dependency
const crypto = require('crypto');

// In-memory user storage (shared across functions via global scope)
global.users = global.users || new Map();

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Initialize with test users if not already done
if (global.users.size === 0) {
  console.log('🔧 Initializing test users...');
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
  console.log('✅ Test users initialized, count:', global.users.size);
}

exports.handler = async (event, context) => {
  console.log('🔍 Registration status function called:', event.httpMethod, event.path);
  console.log('👥 Current users count:', global.users.size);
  
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

  if (event.httpMethod !== 'GET') {
    console.log('❌ Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📤 Returning registration status...');
    
    // Get available users from the global store
    const availableUsers = Array.from(global.users.values()).map(user => 
      `${user.username} (test user)`
    );
    
    // Return registration status and available test users (in-memory for demo)
    const registrationStatus = {
      registrationEnabled: true,
      hasDefaultUsers: global.users.size > 0,
      availableUsers: availableUsers.length > 0 ? availableUsers : [
        'testuser (password: testpass123)',
        'alice (password: alice123)',
        'bob (password: bob123)',
        'charlie (password: charlie123)'
      ]
    };

    console.log('✅ Registration status response:', registrationStatus);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(registrationStatus)
    };

  } catch (error) {
    console.error('❌ Registration status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};
