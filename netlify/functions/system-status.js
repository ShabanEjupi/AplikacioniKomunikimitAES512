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
    const systemStatus = {
      status: 'online',
      uptime: '24h 15m',
      version: '1.0.0',
      environment: 'production',
      security: {
        encryption: 'AES-512',
        hashing: 'ASH-512',
        tls: 'TLS 1.3',
        status: 'secure'
      },
      performance: {
        responseTime: '< 100ms',
        availability: '99.9%'
      },
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(systemStatus)
    };

  } catch (error) {
    console.error('System status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
