const { getDatabase, initializeDatabase, insertDefaultUsers } = require('./db-init.js');

exports.handler = async (event, context) => {
  console.log('🔍 Registration status function called:', event.httpMethod, event.path);
  
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
    console.log('📤 Initializing database and checking registration status...');
    
    // Initialize database and default users
    await initializeDatabase();
    await insertDefaultUsers();
    
    // Check if database is working by counting users
    const sql = getDatabase();
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    
    console.log('👥 Users in database:', userCount[0].count);
    
    // Get list of available users for demo
    const users = await sql`SELECT username FROM users ORDER BY username`;
    const availableUsers = users.map(u => `${u.username} (check default passwords)`);
    
    // Return registration status and available test users
    const registrationStatus = {
      registrationEnabled: true,
      hasDefaultUsers: true,
      userCount: parseInt(userCount[0].count),
      availableUsers: availableUsers,
      databaseStatus: 'connected',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Registration status response:', registrationStatus);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(registrationStatus)
    };

  } catch (error) {
    console.error('❌ Registration status error:', error);
    
    // Fallback response when database is not available
    const fallbackStatus = {
      registrationEnabled: false,
      hasDefaultUsers: false,
      userCount: 0,
      availableUsers: [],
      databaseStatus: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    return {
      statusCode: 200, // Still return 200 but with error info
      headers,
      body: JSON.stringify(fallbackStatus)
    };
  }
};
