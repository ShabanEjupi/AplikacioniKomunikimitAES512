// Simple message handling function
let messages = [];
let messageIdCounter = 1000;

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Return all messages
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          messages: messages.slice(-50) // Return last 50 messages
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const { message, senderId, recipientId } = JSON.parse(event.body);

      if (!message || !senderId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message and senderId required' })
        };
      }

      // Create new message
      const newMessage = {
        id: (++messageIdCounter).toString(),
        content: message,
        senderId,
        recipientId: recipientId || 'all',
        timestamp: new Date().toISOString()
      };

      messages.push(newMessage);

      // Keep only last 100 messages in memory
      if (messages.length > 100) {
        messages = messages.slice(-100);
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          message: 'Message sent successfully',
          messageId: newMessage.id
        })
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
