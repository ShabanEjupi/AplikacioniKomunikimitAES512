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

  // Handle different paths and methods
  const pathParts = event.path.split('/');
  
  // GET /messages/{recipientId} - Get conversation
  if (event.httpMethod === 'GET' && pathParts.length > 2) {
    const recipientId = pathParts[pathParts.length - 1];
    
    try {
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }

      const token = authHeader.split(' ')[1];
      const [currentUserId] = Buffer.from(token, 'base64').toString().split(':');

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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' })
  };
};
