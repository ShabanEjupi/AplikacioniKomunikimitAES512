// Advanced message actions: edit, delete, react, reply
const crypto = require('crypto');

// Access shared message store
const getMessagesStore = () => {
  if (!global.messagesStore) {
    global.messagesStore = {
      messages: [],
      lastAccess: Date.now(),
      sessionId: crypto.randomBytes(8).toString('hex')
    };
  }
  return global.messagesStore;
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, DELETE, POST, OPTIONS',
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
    const store = getMessagesStore();
    const { messageId, action, userId, content, emoji, replyContent } = JSON.parse(event.body || '{}');

    if (!messageId || !action || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'messageId, action, and userId are required' })
      };
    }

    const messageIndex = store.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Message not found' })
      };
    }

    const message = store.messages[messageIndex];

    switch (action) {
      case 'edit':
        // Only sender can edit their own messages
        if (message.senderId !== userId) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Can only edit your own messages' })
          };
        }
        if (!content) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Content is required for editing' })
          };
        }
        message.content = content;
        message.editedAt = new Date().toISOString();
        break;

      case 'delete':
        // Only sender can delete their own messages
        if (message.senderId !== userId) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Can only delete your own messages' })
          };
        }
        store.messages.splice(messageIndex, 1);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, deleted: true })
        };

      case 'react':
        if (!emoji) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Emoji is required for reactions' })
          };
        }
        
        // Initialize reactions array if it doesn't exist
        if (!message.reactions) {
          message.reactions = [];
        }
        
        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(r => r.userId === userId && r.emoji === emoji);
        if (existingReaction) {
          // Remove the reaction
          message.reactions = message.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
        } else {
          // Add new reaction
          message.reactions.push({
            userId,
            emoji,
            timestamp: new Date().toISOString()
          });
          
          // Send notification to message sender (if not reacting to own message)
          if (message.senderId !== userId) {
            try {
              // Use Netlify's URL environment variable (automatically set by Netlify)
              const baseUrl = process.env.URL || 'https://secure-comms-aes512.netlify.app';
              await fetch(`${baseUrl}/.netlify/functions/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipientId: message.senderId,
                  type: 'reaction',
                  senderId: userId,
                  messageId: message.id,
                  emoji: emoji,
                  messageContent: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
                })
              });
            } catch (error) {
              console.error('Failed to send reaction notification:', error);
            }
          }
        }
        break;

      case 'reply':
        if (!replyContent) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'replyContent is required for replies' })
          };
        }
        
        // Create a new message as a reply
        const replyMessage = {
          id: Date.now().toString() + '_' + crypto.randomBytes(8).toString('hex'),
          senderId: userId,
          recipientId: message.senderId === userId ? message.recipientId : message.senderId,
          content: replyContent,
          timestamp: new Date().toISOString(),
          encrypted: message.encrypted || false,
          conversationId: message.conversationId,
          type: 'text',
          fileData: null,
          editedAt: null,
          reactions: [],
          replyTo: {
            messageId: message.id,
            content: message.content.substring(0, 100), // Preview of original message
            senderId: message.senderId
          }
        };
        
        store.messages.push(replyMessage);
        store.lastAccess = Date.now();
        
        // Send notification to original message sender (if not replying to own message)
        if (message.senderId !== userId) {
          try {
            // Use Netlify's URL environment variable (automatically set by Netlify)
            const baseUrl = process.env.URL || 'https://secure-comms-aes512.netlify.app';
            await fetch(`${baseUrl}/.netlify/functions/notifications`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientId: message.senderId,
                type: 'reply',
                senderId: userId,
                messageId: replyMessage.id,
                messageContent: replyContent.substring(0, 100) + (replyContent.length > 100 ? '...' : ''),
                data: {
                  originalMessage: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
                }
              })
            });
          } catch (error) {
            console.error('Failed to send reply notification:', error);
          }
        }
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(replyMessage)
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action. Supported: edit, delete, react, reply' })
        };
    }

    store.lastAccess = Date.now();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(message)
    };

  } catch (error) {
    console.error('Message actions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
