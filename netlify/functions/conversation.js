// In-memory message storage (same as messages.js)
let messages = [];

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
    // Extract recipientId from the path
    const pathParts = event.path.split('/');
    const recipientId = pathParts[pathParts.length - 1];

    if (!recipientId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Recipient ID is required' })
      };
    }

    // Get authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Decode token to get current user
    const token = authHeader.split(' ')[1];
    const [currentUserId] = Buffer.from(token, 'base64').toString().split(':');

    // Filter messages for this conversation
    const conversation = messages.filter(msg => 
      (msg.senderId === currentUserId && msg.recipientId === recipientId) ||
      (msg.senderId === recipientId && msg.recipientId === currentUserId)
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(conversation)
    };

  } catch (error) {
    console.error('Conversation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
