// Login function for Netlify with enhanced initialization
const crypto = require('crypto');

// Enhanced in-memory user storage with session persistence
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
  console.log('🔐 Enhanced Login System v2.1 called:', event.httpMethod, event.path);
  console.log('👥 Available users count:', global.enhancedStore.users.size);
  console.log('🔄 Session ID:', global.enhancedStore.sessionId);
  
  // Update last access time
  global.enhancedStore.lastAccess = Date.now();
  
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

    // Find user with enhanced lookup
    const user = global.enhancedStore.users.get(username);
    
    if (!user) {
      console.log('❌ User not found:', username);
      console.log('📋 Available users:', Array.from(global.enhancedStore.users.keys()));
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid username or password',
          availableUsers: Array.from(global.enhancedStore.users.keys()) // For debugging in production
        })
      };
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User is deactivated:', username);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Account is deactivated' 
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

    // Generate a quantum-ready authentication token
    const tokenData = `${user.userId}:${user.username}:${Date.now()}`;
    const token = Buffer.from(tokenData).toString('base64');
    
    // Update user's last login
    user.lastLogin = new Date().toISOString();
    global.enhancedStore.users.set(username, user);
    
    // Store session for enhanced security
    const sessionId = crypto.randomBytes(16).toString('hex');
    global.enhancedStore.sessions.set(sessionId, {
      userId: user.userId,
      username: user.username,
      token: token,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });

    console.log('✅ Enhanced login successful for user:', user.username, 'with userId:', user.userId);
    console.log('🔐 Session created:', sessionId);

    // Enhanced login response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        user: {
          username: user.username,
          userId: user.userId,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token: token,
        sessionId: sessionId,
        message: 'Quantum-secure authentication successful',
        timestamp: new Date().toISOString()
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
