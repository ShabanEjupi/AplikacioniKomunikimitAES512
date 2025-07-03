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
    const securityInfo = {
      currentUser: 'demo-user',
      encryptionStatus: 'Aktiv (AES-512)',
      keyManagement: 'Sigurt',
      hashFunction: 'ASH-512',
      sessionSecurity: 'TLS 1.3',
      tlsStatus: 'Aktiv',
      messageCount: 0,
      securityLevel: 'I lartë',
      algorithms: {
        symmetric: 'AES-512',
        asymmetric: 'RSA-2048',
        hash: 'ASH-512',
        signature: 'ECDSA-256'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(securityInfo)
    };
  } catch (error) {
    console.error('Security info error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
