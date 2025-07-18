// Call management function for handling cross-user call states
const crypto = require('crypto');

// Global call store
const getCallStore = () => {
  if (!global.callStore) {
    global.callStore = {
      activeCalls: new Map(),
      lastAccess: Date.now(),
      sessionId: crypto.randomBytes(8).toString('hex')
    };
  }
  
  // Cleanup old calls (older than 1 hour)
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  for (const [callId, call] of global.callStore.activeCalls.entries()) {
    if (now - call.timestamp > oneHour) {
      global.callStore.activeCalls.delete(callId);
    }
  }
  
  return global.callStore;
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const store = getCallStore();
    const { action, callData, callId, userId } = JSON.parse(event.body || '{}');

    switch (action) {
      case 'store_call':
        if (!callData) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'callData is required' })
          };
        }
        
        store.activeCalls.set(callData.callId, {
          ...callData,
          timestamp: Date.now()
        });
        store.lastAccess = Date.now();
        
        // Send call invitation notification to recipient
        try {
          // Skip notification sending for now to avoid issues
          console.log('Call invitation would be sent to:', callData.recipientId);
        } catch (error) {
          console.error('Failed to send call invitation notification:', error);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, callId: callData.callId })
        };

      case 'check_incoming_calls':
        if (!userId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'userId is required' })
          };
        }

        // Find calls for this user
        const incomingCall = Array.from(store.activeCalls.values())
          .find(call => call.recipientId === userId && call.status === 'ringing');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ incomingCall: incomingCall || null })
        };

      case 'accept_call':
        if (!callId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'callId is required' })
          };
        }
        
        const callToAccept = store.activeCalls.get(callId);
        if (!callToAccept) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Call not found or already ended' })
          };
        }
        
        // Update call status to accepted
        callToAccept.status = 'accepted';
        callToAccept.acceptedAt = Date.now();
        store.activeCalls.set(callId, callToAccept);
        store.lastAccess = Date.now();
        
        // Send acceptance notification to caller
        try {
          const baseUrl = process.env.URL || 'https://cryptocall.netlify.app';
          await fetch(`${baseUrl}/.netlify/functions/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: callToAccept.callerId,
              type: 'call_accepted',
              senderId: callToAccept.recipientId,
              callId: callId,
              data: {
                acceptedBy: callToAccept.recipientId
              }
            })
          });
        } catch (error) {
          console.error('Failed to send call acceptance notification:', error);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Call accepted',
            callData: callToAccept
          })
        };

      case 'decline_call':
        if (!callId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'callId is required' })
          };
        }
        
        const callToDecline = store.activeCalls.get(callId);
        if (!callToDecline) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Call not found or already ended' })
          };
        }
        
        // Remove the call from active calls
        store.activeCalls.delete(callId);
        store.lastAccess = Date.now();
        
        // Send decline notification to caller
        try {
          const baseUrl = process.env.URL || 'https://cryptocall.netlify.app';
          await fetch(`${baseUrl}/.netlify/functions/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: callToDecline.callerId,
              type: 'call_declined',
              senderId: callToDecline.recipientId,
              callId: callId,
              data: {
                declinedBy: callToDecline.recipientId
              }
            })
          });
        } catch (error) {
          console.error('Failed to send call decline notification:', error);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Call declined'
          })
        };

      case 'check_call_status':
        if (!callId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'callId is required' })
          };
        }

        const call = store.activeCalls.get(callId);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            status: call ? call.status : 'ended',
            call: call || null
          })
        };

      case 'end_call':
        if (!callId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'callId is required' })
          };
        }

        const callToEnd = store.activeCalls.get(callId);
        if (callToEnd) {
          callToEnd.status = 'ended';
          callToEnd.endedAt = new Date().toISOString();
          
          // Send call ended notification to both participants
          const participants = [callToEnd.callerId, callToEnd.recipientId];
          for (const participantId of participants) {
            try {
              // Use Netlify's URL environment variable (automatically set by Netlify)
              const baseUrl = process.env.URL || 'https://cryptocall.netlify.app';
              await fetch(`${baseUrl}/.netlify/functions/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipientId: participantId,
                  type: 'call_ended',
                  callId: callId,
                  data: {
                    callType: callToEnd.type,
                    duration: callToEnd.connectedAt ? 
                      Math.floor((Date.now() - new Date(callToEnd.connectedAt).getTime()) / 1000) : 0
                  }
                })
              });
            } catch (error) {
              console.error('Failed to send call ended notification:', error);
            }
          }
          
          // Keep the call data briefly for the other party to see
          setTimeout(() => {
            store.activeCalls.delete(callId);
          }, 5000); // Delete after 5 seconds
        } else {
          store.activeCalls.delete(callId);
        }
        store.lastAccess = Date.now();

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };

      case 'check_call_ended':
        if (!callId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'callId is required' })
          };
        }

        const endedCall = store.activeCalls.get(callId);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            ended: !endedCall || endedCall.status === 'ended'
          })
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('Call management error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
