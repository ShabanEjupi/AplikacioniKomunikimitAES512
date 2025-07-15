// Real-time notification system for reactions, replies, calls, and other events
const crypto = require('crypto');

// Global notification store
const getNotificationStore = () => {
  if (!global.notificationStore) {
    global.notificationStore = {
      userNotifications: new Map(), // userId -> notifications[]
      lastAccess: Date.now(),
      sessionId: crypto.randomBytes(8).toString('hex'),
      cleanupInterval: null
    };
    
    // Setup automatic cleanup every 5 minutes
    global.notificationStore.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      for (const [userId, notifications] of global.notificationStore.userNotifications.entries()) {
        const filtered = notifications.filter(notif => now - notif.timestamp < fiveMinutes);
        if (filtered.length === 0) {
          global.notificationStore.userNotifications.delete(userId);
        } else {
          global.notificationStore.userNotifications.set(userId, filtered);
        }
      }
    }, 5 * 60 * 1000);
  }
  
  return global.notificationStore;
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const store = getNotificationStore();
    const method = event.httpMethod;
    
    if (method === 'GET') {
      // Get notifications for a user
      const userId = event.queryStringParameters?.userId;
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'userId is required' })
        };
      }
      
      const userNotifications = store.userNotifications.get(userId) || [];
      
      // Mark as read and remove from store
      store.userNotifications.delete(userId);
      store.lastAccess = Date.now();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ notifications: userNotifications })
      };
    }
    
    if (method === 'POST') {
      // Send notification to user
      const { 
        recipientId, 
        type, 
        data, 
        senderId,
        senderName,
        messageId,
        messageContent,
        emoji,
        callId,
        callType
      } = JSON.parse(event.body || '{}');
      
      if (!recipientId || !type) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'recipientId and type are required' })
        };
      }
      
      const notification = {
        id: Date.now().toString() + '_' + crypto.randomBytes(4).toString('hex'),
        type,
        timestamp: Date.now(),
        data: data || {},
        senderId,
        senderName,
        messageId,
        messageContent,
        emoji,
        callId,
        callType,
        read: false
      };
      
      // Add notification to recipient's queue
      const existingNotifications = store.userNotifications.get(recipientId) || [];
      existingNotifications.push(notification);
      store.userNotifications.set(recipientId, existingNotifications);
      store.lastAccess = Date.now();
      
      console.log(`📢 Notification sent to ${recipientId}:`, notification);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, notificationId: notification.id })
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error) {
    console.error('Notification system error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
