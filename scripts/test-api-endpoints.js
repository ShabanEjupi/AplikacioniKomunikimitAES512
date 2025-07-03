#!/usr/bin/env node

console.log('🔍 API Endpoint Testing Script');
console.log('==============================\n');

const axios = require('axios');

// Test configuration
const config = {
  local: 'http://localhost:3000/api',
  production: 'https://cryptocall.netlify.app/api'
};

async function testEndpoint(baseUrl, endpoint, method = 'GET', data = null) {
  try {
    const url = `${baseUrl}${endpoint}`;
    console.log(`📤 Testing ${method} ${url}`);
    
    const response = await axios({
      method,
      url,
      data,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${response.status}: ${JSON.stringify(response.data)}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ ${error.response?.status || 'ERROR'}: ${error.message}`);
    if (error.response?.data) {
      console.error(`   Response: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, error: error.message };
  }
}

async function runTests(baseUrl, label) {
  console.log(`\n🚀 Testing ${label} (${baseUrl})`);
  console.log('='.repeat(50));
  
  // Test endpoints
  const endpoints = [
    { path: '/registration-status', method: 'GET' },
    { path: '/system/status', method: 'GET' },
    { path: '/login', method: 'POST', data: { username: 'testuser', password: 'testpass123' } },
    { path: '/users', method: 'GET' },
    { path: '/security/info', method: 'GET' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(baseUrl, endpoint.path, endpoint.method, endpoint.data);
    results.push({ endpoint: endpoint.path, ...result });
    console.log(''); // Empty line for readability
  }
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';
  
  if (!config[environment]) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.log('Available environments:', Object.keys(config));
    process.exit(1);
  }
  
  try {
    const results = await runTests(config[environment], environment);
    
    console.log('\n📊 Summary:');
    console.log('='.repeat(30));
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.endpoint}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n${successCount}/${results.length} endpoints working`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
