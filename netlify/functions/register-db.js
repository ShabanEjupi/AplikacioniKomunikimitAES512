const { neon } = require('@neondatabase/serverless');

// Get database connection
const sql = neon(process.env.DATABASE_URL);

// Import our ASH-512 implementation
const { hash } = require('../../shared/src/crypto/ash512-impl.js');

exports.handler = async (event, context) => {
  console.log('📝 Register function with database called:', event.httpMethod, event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const { username, password } = JSON.parse(event.body);
    
    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 8 characters long' })
      };
    }

    console.log(`📤 Attempting registration for user: ${username}`);

    // Check if user already exists
    const existingUsers = await sql`
      SELECT username FROM users WHERE username = ${username}
    `;

    if (existingUsers.length > 0) {
      console.log(`❌ User already exists: ${username}`);
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Username already exists' })
      };
    }

    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Hash password with ASH-512
    const passwordHash = hash(password + 'salt123'); // Use consistent salt

    // Insert new user
    await sql`
      INSERT INTO users (username, password_hash, user_id)
      VALUES (${username}, ${passwordHash}, ${userId})
    `;

    // Log registration
    await sql`
      INSERT INTO security_audit (user_id, action, details, ip_address)
      VALUES (${userId}, 'user_registration', ${{ username }}, ${event.headers['x-forwarded-for'] || 'unknown'})
    `;

    console.log(`✅ Registration successful for user: ${username}`);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User registered successfully',
        user: {
          username,
          userId
        }
      })
    };

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Check for unique constraint violation
    if (error.message.includes('duplicate key')) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Username already exists' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};
