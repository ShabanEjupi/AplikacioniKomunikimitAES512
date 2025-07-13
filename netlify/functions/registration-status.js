// Enhanced registration status with quantum-ready architecture
const crypto = require('crypto');

// Enhanced in-memory user storage with session persistence (shared store)
if (!global.enhancedStore) {
  global.enhancedStore = {
    users: new Map(),
    sessions: new Map(),
    lastAccess: Date.now(),
    sessionId: crypto.randomBytes(8).toString('hex'),
    version: '2.1'
  };
  
  console.log('🚀 Initializing Enhanced Secure Communication Store v2.1');
}

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Initialize with quantum-ready test users if not already done
if (global.enhancedStore.users.size === 0) {
  console.log('🔧 Initializing quantum-ready test users...');
  
  // Advanced test users with enhanced security profiles
  const testUsers = [
    { username: 'testuser', password: 'testpass123', userId: '1001', role: 'user' },
    { username: 'alice', password: 'alice123', userId: '1002', role: 'user' },
    { username: 'bob', password: 'bob123', userId: '1003', role: 'user' },
    { username: 'charlie', password: 'charlie123', userId: '1004', role: 'user' },
    { username: 'admin', password: 'admin123', userId: '1000', role: 'admin' },
    { username: 'demo', password: 'demo123', userId: '1005', role: 'demo' }
  ];
  
  testUsers.forEach(user => {
    global.enhancedStore.users.set(user.username, {
      username: user.username,
      password: hashPassword(user.password),
      userId: user.userId,
      role: user.role,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    });
  });
  
  console.log('✅ Quantum-ready test users initialized, count:', global.enhancedStore.users.size);
  console.log('👥 Available users:', Array.from(global.enhancedStore.users.keys()));
}

exports.handler = async (event, context) => {
  console.log('🔍 Enhanced Registration Status v2.1 called:', event.httpMethod, event.path);
  console.log('👥 Current users count:', global.enhancedStore.users.size);
  console.log('🔄 Session ID:', global.enhancedStore.sessionId);
  
  // Update last access time
  global.enhancedStore.lastAccess = Date.now();
  
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
    console.log('📤 Returning enhanced registration status...');
    
    // Get available users from the enhanced store
    const availableUsers = Array.from(global.enhancedStore.users.values()).map(user => 
      `${user.username} (${user.role}) - Last login: ${user.lastLogin || 'Never'}`
    );
    
    // Return enhanced registration status with quantum-ready features
    const registrationStatus = {
      registrationEnabled: true,
      hasDefaultUsers: global.enhancedStore.users.size > 0,
      availableUsers: availableUsers.length > 0 ? availableUsers : [
        'testuser (password: testpass123) - Default user',
        'alice (password: alice123) - Test user',
        'bob (password: bob123) - Test user',
        'charlie (password: charlie123) - Test user',
        'admin (password: admin123) - Admin user',
        'demo (password: demo123) - Demo user'
      ],
      systemInfo: {
        version: global.enhancedStore.version,
        sessionId: global.enhancedStore.sessionId,
        userCount: global.enhancedStore.users.size,
        sessionCount: global.enhancedStore.sessions.size,
        lastAccess: new Date(global.enhancedStore.lastAccess).toISOString()
      }
    };

    console.log('✅ Enhanced registration status response:', registrationStatus);

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
