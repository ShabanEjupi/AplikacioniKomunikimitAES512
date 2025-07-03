#!/usr/bin/env node

const axios = require('axios');

// Test the deployed Netlify functions directly
const BASE_URL = 'https://cryptocall.netlify.app';

async function testFunction(endpoint, expectedKeys = []) {
    const url = `${BASE_URL}/.netlify/functions/${endpoint}`;
    console.log(`\n🔍 Testing: ${url}`);
    
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'API-Test-Script'
            }
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Content-Type: ${response.headers['content-type']}`);
        
        if (typeof response.data === 'object') {
            console.log(`📋 Response keys: ${Object.keys(response.data).join(', ')}`);
            
            // Check for expected keys
            for (const key of expectedKeys) {
                if (response.data.hasOwnProperty(key)) {
                    console.log(`  ✅ ${key}: ${JSON.stringify(response.data[key])}`);
                } else {
                    console.log(`  ❌ Missing key: ${key}`);
                }
            }
        } else {
            console.log(`📋 Response type: ${typeof response.data}`);
            console.log(`📋 Response length: ${response.data.length} chars`);
            
            // Check if it's HTML (the problem we're trying to fix)
            if (typeof response.data === 'string' && response.data.includes('<html')) {
                console.log(`❌ ERROR: Received HTML instead of JSON!`);
                console.log(`📄 First 200 chars: ${response.data.substring(0, 200)}...`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Headers: ${JSON.stringify(error.response.headers)}`);
        }
    }
}

async function testRedirectsViaAPI() {
    const apiEndpoints = [
        { path: '/api/health', expected: ['status', 'timestamp'] },
        { path: '/api/registration-status', expected: ['registrationEnabled', 'hasDefaultUsers'] },
        { path: '/api/users', expected: [] },
        { path: '/api/system/status', expected: [] }
    ];
    
    console.log('🌐 Testing API endpoints (via redirects)...');
    
    for (const { path, expected } of apiEndpoints) {
        const url = `${BASE_URL}${path}`;
        console.log(`\n🔍 Testing redirect: ${url}`);
        
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'API-Test-Script'
                }
            });
            
            console.log(`✅ Status: ${response.status}`);
            console.log(`📊 Content-Type: ${response.headers['content-type']}`);
            
            if (typeof response.data === 'object') {
                console.log(`📋 Response keys: ${Object.keys(response.data).join(', ')}`);
                
                // Check for expected keys
                for (const key of expected) {
                    if (response.data.hasOwnProperty(key)) {
                        console.log(`  ✅ ${key}: ${JSON.stringify(response.data[key])}`);
                    } else {
                        console.log(`  ❌ Missing key: ${key}`);
                    }
                }
            } else {
                console.log(`📋 Response type: ${typeof response.data}`);
                
                // Check if it's HTML (the problem we're trying to fix)
                if (typeof response.data === 'string' && response.data.includes('<html')) {
                    console.log(`❌ ERROR: Received HTML instead of JSON!`);
                    console.log(`   This means the redirect is not working properly.`);
                } else {
                    console.log(`📋 Response: ${JSON.stringify(response.data)}`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
}

async function main() {
    console.log('🚀 Netlify Functions Test Script');
    console.log('=================================\n');
    
    // Test direct function access
    console.log('📞 Testing direct function access...');
    await testFunction('health-check', ['status', 'timestamp']);
    await testFunction('registration-status-simple', ['registrationEnabled', 'hasDefaultUsers']);
    await testFunction('login-simple'); // This will be a GET request, should return method not allowed
    await testFunction('users');
    
    // Test API redirects
    await testRedirectsViaAPI();
    
    console.log('\n✅ Test completed!');
    console.log('\n💡 If you see HTML responses instead of JSON, the redirects need to be fixed.');
    console.log('💡 Check the Netlify dashboard for function logs and deployment status.');
}

if (require.main === module) {
    main().catch(console.error);
}
