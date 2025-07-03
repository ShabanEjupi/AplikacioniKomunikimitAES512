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
    console.log('📤 Returning registration status...');
    
    // Return registration status and available test users
    const registrationStatus = {
      registrationEnabled: true,
      hasDefaultUsers: true,
      availableUsers: [
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
