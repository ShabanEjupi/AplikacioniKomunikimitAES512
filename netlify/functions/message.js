// In-memory message storage for demo
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { message, recipientId } = JSON.parse(event.body);
    const authHeader = event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Decode token to get sender info
    const token = authHeader.split(' ')[1];
    const [senderId, username] = Buffer.from(token, 'base64').toString().split(':');

    const newMessage = {
      id: Date.now().toString(),
      content: message,
      timestamp: new Date().toISOString(),
      senderId,
      recipientId: recipientId || 'all',
      senderUsername: username
    };

    messages.push(newMessage);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newMessage)
    };

  } catch (error) {
    console.error('Message error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
