const { hash } = require('../../shared/src/crypto/ash512-impl.js');
const { getDatabase, initializeDatabase, insertDefaultUsers } = require('./db-init.js');

exports.handler = async (event, context) => {
  console.log('🔑 Database Login function called:', event.httpMethod, event.path);
  
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
    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const { username, password } = requestBody;

    console.log('📤 Login attempt for user:', username);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    // Try database first, fallback to in-memory if database fails
    try {
      // Initialize database first
      await initializeDatabase();
      await insertDefaultUsers();
      
      const sql = getDatabase();
      
      // Get user from database
      const users = await sql`
        SELECT username, password_hash, user_id 
        FROM users 
        WHERE username = ${username}
      `;

      if (users.length === 0) {
        console.log('❌ User not found in database:', username);
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid username or password' })
        };
      }

      const user = users[0];
      const providedPasswordHash = hash(password);

      if (user.password_hash !== providedPasswordHash) {
        console.log('❌ Invalid password for user:', username);
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid username or password' })
        };
      }

      // Generate session token (simple demo token)
      const sessionToken = `session_${user.user_id}_${Date.now()}`;

      console.log('✅ Database login successful for user:', username);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Login successful',
          token: sessionToken,
          userId: user.user_id,
          username: user.username,
          method: 'database'
        })
      };

    } catch (dbError) {
      console.error('❌ Database login failed, trying fallback:', dbError.message);
      
      // Fallback to in-memory users
      const fallbackUsers = new Map([
        ['testuser', { username: 'testuser', password: hash('testpass123'), userId: '1001' }],
        ['alice', { username: 'alice', password: hash('alice123'), userId: '1002' }],
        ['bob', { username: 'bob', password: hash('bob123'), userId: '1003' }],
        ['charlie', { username: 'charlie', password: hash('charlie123'), userId: '1004' }]
      ]);

      const user = fallbackUsers.get(username);
      if (!user) {
        console.log('❌ User not found in fallback:', username);
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid username or password' })
        };
      }

      const providedPasswordHash = hash(password);
      if (user.password !== providedPasswordHash) {
        console.log('❌ Invalid password for fallback user:', username);
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid username or password' })
        };
      }

      const sessionToken = `session_${user.userId}_${Date.now()}`;

      console.log('✅ Fallback login successful for user:', username);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Login successful (fallback mode)',
          token: sessionToken,
          userId: user.userId,
          username: user.username,
          method: 'fallback'
        })
      };
    }

  } catch (error) {
    console.error('❌ Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};
