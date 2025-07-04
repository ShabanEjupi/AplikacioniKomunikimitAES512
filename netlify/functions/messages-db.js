const { neon } = require('@neondatabase/serverless');

// Get database connection
function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL or NETLIFY_DATABASE_URL environment variable not set');
    throw new Error('Database URL not configured');
  }
  
  console.log('🔗 Using database URL:', databaseUrl.substring(0, 50) + '...');
  return neon(databaseUrl);
}

const sql = getDatabase();

exports.handler = async (event, context) => {
  console.log('💬 Messages function with database called:', event.httpMethod, event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get all messages for current user
      const authHeader = event.headers.authorization;
      if (!authHeader) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' })
        };
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Verify session token
      const sessions = await sql`
        SELECT s.user_id, u.username 
        FROM sessions s 
        JOIN users u ON s.user_id = u.user_id 
        WHERE s.session_token = ${token} 
        AND s.expires_at > CURRENT_TIMESTAMP 
        AND s.is_active = true
      `;

      if (sessions.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid or expired token' })
        };
      }

      const currentUser = sessions[0];

      // Get messages where user is sender or recipient
      const messages = await sql`
        SELECT 
          m.message_id as id,
          m.encrypted_content as content,
          m.timestamp,
          m.sender_id as senderId,
          m.recipient_id as recipientId,
          s.username as senderName,
          r.username as recipientName
        FROM messages m
        JOIN users s ON m.sender_id = s.user_id
        JOIN users r ON m.recipient_id = r.user_id
        WHERE (m.sender_id = ${currentUser.user_id} OR m.recipient_id = ${currentUser.user_id})
        AND m.is_deleted = false
        ORDER BY m.timestamp DESC
        LIMIT 100
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(messages)
      };
    }

    if (event.httpMethod === 'POST') {
      // Send new message
      const { message, recipientId } = JSON.parse(event.body);
      
      if (!message || !recipientId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message and recipientId are required' })
        };
      }

      const authHeader = event.headers.authorization;
      if (!authHeader) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' })
        };
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Verify session token
      const sessions = await sql`
        SELECT user_id FROM sessions 
        WHERE session_token = ${token} 
        AND expires_at > CURRENT_TIMESTAMP 
        AND is_active = true
      `;

      if (sessions.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid or expired token' })
        };
      }

      const senderId = sessions[0].user_id;

      // Verify recipient exists
      const recipients = await sql`
        SELECT user_id FROM users WHERE user_id = ${recipientId} AND is_active = true
      `;

      if (recipients.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Recipient not found' })
        };
      }

      // Generate message ID and encrypt content (simplified - in production use proper AES-512)
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const encryptedContent = `encrypted:${Buffer.from(message).toString('base64')}`;
      
      // Generate integrity hash with ASH-512
      const { hash } = require('../../shared/src/crypto/ash512-impl.js');
      const integrityHash = hash(message + messageId + senderId + recipientId);

      // Store message in database
      await sql`
        INSERT INTO messages (message_id, sender_id, recipient_id, encrypted_content, integrity_hash)
        VALUES (${messageId}, ${senderId}, ${recipientId}, ${encryptedContent}, ${integrityHash})
      `;

      console.log(`✅ Message sent from ${senderId} to ${recipientId}`);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          messageId,
          timestamp: new Date().toISOString()
        })
      };
    }

  } catch (error) {
    console.error('❌ Messages error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};
