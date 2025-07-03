// In-memory user storage (same as other functions)
let users = new Map([
  ['testuser', { username: 'testuser', userId: '1001' }],
  ['alice', { username: 'alice', userId: '1002' }],
  ['bob', { username: 'bob', userId: '1003' }],
  ['charlie', { username: 'charlie', userId: '1004' }]
]);

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
    const userList = Array.from(users.values());
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(userList)
    };
  } catch (error) {
    console.error('Users error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
