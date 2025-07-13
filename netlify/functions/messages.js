// Messages function for Netlify
const crypto = require('crypto');

// Enhanced in-memory storage with session persistence
if (!global.messagesStore) {
  global.messagesStore = {
    messages: [],
    lastAccess: Date.now(),
    sessionId: crypto.randomBytes(8).toString('hex')
  };
}

// Auto-clean old messages to prevent memory leaks (keep last 1000 messages)
const cleanOldMessages = () => {
  if (global.messagesStore.messages.length > 1000) {
    global.messagesStore.messages = global.messagesStore.messages.slice(-1000);
  }
};

const generateId = () => {
  return Date.now().toString() + '_' + crypto.randomBytes(8).toString('hex');
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
      // Clean old messages and update last access
      cleanOldMessages();
      global.messagesStore.lastAccess = Date.now();
      
      // Get messages
      const { conversationId } = event.queryStringParameters || {};
      
      let filteredMessages = global.messagesStore.messages;
      
      if (conversationId) {
        filteredMessages = global.messagesStore.messages.filter(msg => 
          msg.conversationId === conversationId
        );
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          messages: filteredMessages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ),
          sessionId: global.messagesStore.sessionId,
          totalMessages: global.messagesStore.messages.length
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Send message
      const { senderId, recipientId, content, encrypted, fileData } = JSON.parse(event.body || '{}');

      if (!senderId || !recipientId || (!content && !fileData)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'senderId, recipientId, and content or fileData are required' })
        };
      }

      const message = {
        id: generateId(),
        senderId,
        recipientId,
        content: content || '',
        timestamp: new Date().toISOString(),
        encrypted: encrypted || false,
        conversationId: [senderId, recipientId].sort().join('_'),
        type: fileData ? 'file' : 'text',
        fileData: fileData || null,
        editedAt: null,
        reactions: [],
        replyTo: null
      };

      global.messagesStore.messages.push(message);
      global.messagesStore.lastAccess = Date.now();
      
      // Clean old messages after adding new one
      cleanOldMessages();

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