#!/usr/bin/env node

/**
 * 🧪 Complete App Testing Suite
 * Tests the entire user workflow including registration, login, messaging, file upload, and calls
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://cryptocall.netlify.app';

// Test user registration
async function testUserRegistration() {
    console.log('🧪 Testing User Registration...');
    
    try {
        const user = {
            username: 'testuser' + Date.now(),
            password: 'TestPass123!'
        };
        
        const response = await fetch(`${BASE_URL}/.netlify/functions/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user)
        });
        
        console.log('👤 Registration Response Status:', response.status);
        const result = await response.json();
        console.log('👤 Registration Result:', result);
        
        if (result.success) {
            // Test login
            await testUserLogin(user);
        }
        
    } catch (error) {
        console.error('❌ Registration Error:', error);
    }
}

// Test user login
async function testUserLogin(credentials) {
    console.log('🧪 Testing User Login...');
    
    try {
        const response = await fetch(`${BASE_URL}/.netlify/functions/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });
        
        console.log('🔐 Login Response Status:', response.status);
        const result = await response.json();
        console.log('🔐 Login Result:', result);
        
        if (result.success) {
            await testMessageFunctionality(result.user.userId);
        }
        
    } catch (error) {
        console.error('❌ Login Error:', error);
    }
}

// Test messaging functionality
async function testMessageFunctionality(userId) {
    console.log('🧪 Testing Message Functionality...');
    
    try {
        // Send a test message
        const message = {
            senderId: userId,
            recipientId: 'demo-user',
            content: 'Test message from API test suite',
            encrypted: true
        };
        
        const response = await fetch(`${BASE_URL}/.netlify/functions/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });
        
        console.log('💬 Message Response Status:', response.status);
        const result = await response.json();
        console.log('💬 Message Result:', result);
        
        if (result.id) {
            // Test file upload with this message
            await testCompleteFileWorkflow(userId, 'demo-user');
        }
        
    } catch (error) {
        console.error('❌ Message Error:', error);
    }
}

// Test complete file workflow
async function testCompleteFileWorkflow(senderId, recipientId) {
    console.log('🧪 Testing Complete File Workflow...');
    
    try {
        // 1. Upload file
        const testContent = 'This is a comprehensive test file for the secure chat app';
        const testFile = Buffer.from(testContent).toString('base64');
        
        const uploadResponse = await fetch(`${BASE_URL}/.netlify/functions/file-storage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileName: 'test-document.txt',
                fileType: 'text/plain',
                fileSize: testContent.length,
                fileData: testFile,
                senderId: senderId,
                encryptionKey: 'secure-key-123'
            })
        });
        
        console.log('📎 File Upload Status:', uploadResponse.status);
        const uploadResult = await uploadResponse.json();
        console.log('📎 File Upload Result:', uploadResult);
        
        if (uploadResult.fileId) {
            // 2. Send file message
            const messageResponse = await fetch(`${BASE_URL}/.netlify/functions/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    senderId: senderId,
                    recipientId: recipientId,
                    content: `📎 ${uploadResult.fileName}`,
                    encrypted: true,
                    fileData: uploadResult
                })
            });
            
            console.log('📎 File Message Status:', messageResponse.status);
            const messageResult = await messageResponse.json();
            console.log('📎 File Message Result:', messageResult);
            
            // 3. Test file download
            const downloadResponse = await fetch(`${uploadResult.downloadUrl}&download=true`);
            console.log('📥 File Download Status:', downloadResponse.status);
            console.log('📥 File Download Type:', downloadResponse.headers.get('content-type'));
            
            // 4. Test file preview
            const previewResponse = await fetch(uploadResult.downloadUrl);
            console.log('👁️ File Preview Status:', previewResponse.status);
            const previewResult = await previewResponse.json();
            console.log('👁️ File Preview Result:', previewResult);
        }
        
    } catch (error) {
        console.error('❌ File Workflow Error:', error);
    }
}

// Test call functionality with full workflow
async function testCompleteCallWorkflow() {
    console.log('🧪 Testing Complete Call Workflow...');
    
    try {
        const callId = 'comprehensive-test-' + Date.now();
        const callData = {
            callId: callId,
            callerId: 'test-caller',
            recipientId: 'test-recipient',
            type: 'video',
            status: 'ringing',
            timestamp: Date.now(),
            roomId: 'room-' + Date.now()
        };
        
        // 1. Initiate call
        const initiateResponse = await fetch(`${BASE_URL}/.netlify/functions/call-management`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'store_call',
                callData: callData
            })
        });
        
        console.log('📞 Call Initiate Status:', initiateResponse.status);
        const initiateResult = await initiateResponse.json();
        console.log('📞 Call Initiate Result:', initiateResult);
        
        // 2. Check incoming call
        const checkResponse = await fetch(`${BASE_URL}/.netlify/functions/call-management`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'check_incoming_calls',
                userId: callData.recipientId
            })
        });
        
        console.log('📞 Incoming Check Status:', checkResponse.status);
        const checkResult = await checkResponse.json();
        console.log('📞 Incoming Check Result:', checkResult);
        
        // 3. Accept call
        const acceptResponse = await fetch(`${BASE_URL}/.netlify/functions/call-management`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'accept_call',
                callId: callId
            })
        });
        
        console.log('📞 Call Accept Status:', acceptResponse.status);
        const acceptResult = await acceptResponse.json();
        console.log('📞 Call Accept Result:', acceptResult);
        
        // 4. End call
        const endResponse = await fetch(`${BASE_URL}/.netlify/functions/call-management`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'end_call',
                callId: callId
            })
        });
        
        console.log('📞 Call End Status:', endResponse.status);
        const endResult = await endResponse.json();
        console.log('📞 Call End Result:', endResult);
        
    } catch (error) {
        console.error('❌ Call Workflow Error:', error);
    }
}

// Run comprehensive test suite
async function runComprehensiveTests() {
    console.log('🧪 COMPREHENSIVE APP TESTING SUITE');
    console.log('===================================');
    console.log('🌐 Base URL:', BASE_URL);
    console.log('===================================\n');
    
    // Test basic functionality
    await testUserRegistration();
    
    console.log('\n───────────────────────────────────\n');
    
    // Test call functionality
    await testCompleteCallWorkflow();
    
    console.log('\n===================================');
    console.log('✅ COMPREHENSIVE TESTING COMPLETE');
    console.log('===================================');
}

runComprehensiveTests().catch(console.error);
