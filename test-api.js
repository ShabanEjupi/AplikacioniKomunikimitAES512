#!/usr/bin/env node

/**
 * 🧪 API Testing Script for Secure Communications App
 * 
 * This script demonstrates how to test your Netlify functions
 * without using localhost. Perfect for production testing!
 * 
 * Usage:
 *   node test-api.js
 * 
 * Or via npm:
 *   npm run test:api
 */

const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  // Change this to your deployed Netlify URL
  BASE_URL: process.env.NETLIFY_URL || 'https://secure-comms-aes512.netlify.app',
  LOCAL_DEV: process.env.NODE_ENV === 'development',
  
  // Test user credentials
  TEST_USER: {
    username: 'testuser2025',
    password: 'SecurePass123!',
    email: 'test@example.com'
  }
};

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${CONFIG.BASE_URL}/.netlify/functions/${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'API-Tester/1.0',
    },
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  console.log(`🌐 ${finalOptions.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test functions
const tests = {
  async healthCheck() {
    console.log('\\n🔍 Testing Health Check...');
    return await apiRequest('health-check');
  },

  async registrationStatus() {
    console.log('\\n📋 Testing Registration Status...');
    return await apiRequest('registration-status');
  },

  async systemStatus() {
    console.log('\\n⚙️ Testing System Status...');
    return await apiRequest('system-status');
  },

  async securityInfo() {
    console.log('\\n🛡️ Testing Security Info...');
    return await apiRequest('security-info');
  },

  async userRegistration() {
    console.log('\\n👤 Testing User Registration...');
    return await apiRequest('register', {
      method: 'POST',
      body: JSON.stringify(CONFIG.TEST_USER),
    });
  },

  async userLogin() {
    console.log('\\n🔐 Testing User Login...');
    return await apiRequest('login', {
      method: 'POST',
      body: JSON.stringify({
        username: CONFIG.TEST_USER.username,
        password: CONFIG.TEST_USER.password,
      }),
    });
  },

  async getUsers() {
    console.log('\\n👥 Testing Get Users...');
    return await apiRequest('users');
  },

  async getMessages() {
    console.log('\\n💬 Testing Get Messages...');
    return await apiRequest('messages');
  },

  async sendTestMessage() {
    console.log('\\n📤 Testing Send Message...');
    return await apiRequest('messages', {
      method: 'POST',
      body: JSON.stringify({
        senderId: 'testuser2025',
        recipientId: 'user2',
        content: '🚀 Test message from API testing script!',
        encrypted: false,
      }),
    });
  },

  async messageActions() {
    console.log('\\n⚡ Testing Message Actions...');
    // First get messages to find a message to react to
    const messagesResponse = await apiRequest('messages');
    
    if (messagesResponse.success && messagesResponse.data.messages?.length > 0) {
      const firstMessage = messagesResponse.data.messages[0];
      
      return await apiRequest('message-actions', {
        method: 'POST',
        body: JSON.stringify({
          messageId: firstMessage.id,
          action: 'react',
          userId: 'testuser2025',
          emoji: '👍',
        }),
      });
    } else {
      console.log('❌ No messages found to react to');
      return { success: false, error: 'No messages available' };
    }
  },
};

// Main test runner
async function runTests() {
  console.log('🧪 SECURE COMMUNICATIONS API TESTING SUITE');
  console.log('===========================================');
  console.log(`🌐 Base URL: ${CONFIG.BASE_URL}`);
  console.log(`🔧 Environment: ${CONFIG.LOCAL_DEV ? 'Development' : 'Production'}`);
  console.log('===========================================');

  const results = [];

  for (const [testName, testFunc] of Object.entries(tests)) {
    try {
      const result = await testFunc();
      results.push({ test: testName, ...result });
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Test ${testName} failed:`, error.message);
      results.push({ test: testName, success: false, error: error.message });
    }
  }

  // Summary
  console.log('\\n📊 TEST SUMMARY');
  console.log('================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  
  if (successful === total) {
    console.log('\\n🎉 All tests passed! Your API is working perfectly!');
  } else {
    console.log('\\n⚠️ Some tests failed. Check the logs above for details.');
  }

  // Detailed results
  console.log('\\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.success ? 'PASS' : 'FAIL'}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, tests, apiRequest };
