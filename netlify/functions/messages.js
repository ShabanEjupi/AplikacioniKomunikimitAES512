// Messages function for Netlify
const crypto = require('crypto');

// In-memory storage for messages
global.messages = global.messages || [];

const generateId = () => {
  return crypto.randomBytes(16).toString('hex');
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get messages
      const { conversationId } = event.queryStringParameters || {};
      
      let filteredMessages = global.messages;
      
      if (conversationId) {
        filteredMessages = global.messages.filter(msg => 
          msg.conversationId === conversationId
        );
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(filteredMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ))
      };
    }

    if (event.httpMethod === 'POST') {
      // Send message
      const { senderId, recipientId, content, encrypted } = JSON.parse(event.body || '{}');

      if (!senderId || !recipientId || !content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'senderId, recipientId, and content are required' })
        };
      }

      const message = {
        id: generateId(),
        senderId,
        recipientId,
        content,
        timestamp: new Date().toISOString(),
        encrypted: encrypted || false,
        conversationId: [senderId, recipientId].sort().join('_')
      };

      global.messages.push(message);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(message)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Messages error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};