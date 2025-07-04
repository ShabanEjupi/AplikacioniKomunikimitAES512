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

exports.handler = async (event, context) => {
  console.log('👥 Users function called:', event.httpMethod, event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const sql = getDatabase();
    
    // Query database for active users
    const users = await sql`
      SELECT user_id, username, created_at, last_login
      FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
    
    console.log(`📊 Found ${users.length} active users`);
    
    // Transform to expected format
    const userList = users.map(user => ({
      userId: user.user_id,
      username: user.username,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(userList)
    };
  } catch (error) {
    console.error('Users error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
