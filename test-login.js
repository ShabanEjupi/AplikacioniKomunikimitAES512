// Simple test to check login function
const loginFunction = require('./netlify/functions/login.js');

async function testLogin() {
    console.log('🧪 Testing login function...');
    
    // Test with correct credentials
    const testEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
            username: 'testuser',
            password: 'testpass123'
        }),
        headers: {}
    };
    
    try {
        const result = await loginFunction.handler(testEvent, {});
        console.log('✅ Login test result:', result);
        console.log('Response body:', JSON.parse(result.body));
    } catch (error) {
        console.error('❌ Login test failed:', error);
    }
}

testLogin();
