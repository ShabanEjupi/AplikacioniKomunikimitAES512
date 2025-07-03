exports.handler = async (event, context) => {
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(registrationStatus)
    };

  } catch (error) {
    console.error('Registration status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
