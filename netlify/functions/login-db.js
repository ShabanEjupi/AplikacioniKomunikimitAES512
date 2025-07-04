const { neon } = require('@neondatabase/serverless');

// Get database connection
function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL or NETLIFY_DATABASE_URL environment variable not set');
    throw new Error('Database URL not configured');
  }
  
  console.log('🔗 Using database URL:', databaseUrl.substring(0, 50) + '...');
  return neon(databaseUrl);
}

const sql = getDatabase();

// Import our ASH-512 implementation
const { hash } = require('../../shared/src/crypto/ash512-impl.js');

exports.handler = async (event, context) => {
  console.log('🔐 Login function with database called:', event.httpMethod, event.path);
  
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

    console.log(`📤 Attempting login for user: ${username}`);

    // Hash the provided password with ASH-512
    const passwordHash = hash(password + 'salt123'); // Use same salt as registration

    // Query database for user
    const users = await sql`
      SELECT user_id, username, password_hash, is_active, last_login
      FROM users 
      WHERE username = ${username} AND is_active = true
    `;

    if (users.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid username or password' })
      };
    }

    const user = users[0];

    // Verify password hash
    if (user.password_hash !== passwordHash) {
      console.log(`❌ Password mismatch for user: ${username}`);
      
      // Log failed login attempt
      await sql`
        INSERT INTO security_audit (user_id, action, details, ip_address)
        VALUES (${user.user_id}, 'failed_login', ${{ username }}, ${event.headers['x-forwarded-for'] || 'unknown'})
      `;
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid username or password' })
      };
    }

    // Generate session token
    const sessionToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session in database
    await sql`
      INSERT INTO sessions (session_token, user_id, expires_at)
      VALUES (${sessionToken}, ${user.user_id}, ${expiresAt})
    `;

    // Update last login
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE user_id = ${user.user_id}
    `;

    // Log successful login
    await sql`
      INSERT INTO security_audit (user_id, action, details, ip_address)
      VALUES (${user.user_id}, 'successful_login', ${{ username }}, ${event.headers['x-forwarded-for'] || 'unknown'})
    `;

    console.log(`✅ Login successful for user: ${username}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: sessionToken,
        user: {
          username: user.username,
          userId: user.user_id
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
