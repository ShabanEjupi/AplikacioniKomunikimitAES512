#!/usr/bin/env node

/**
 * 🧪 Call Functionality Testing Script
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://cryptocall.netlify.app';

// Test call initiation
async function testCallStart() {
    console.log('🧪 Testing Call Start...');
    
    try {
        const callData = {
            callId: 'test-call-' + Date.now(),
            callerId: 'test-user-1',
            recipientId: 'test-user-2',
            type: 'video',
            status: 'ringing',
            timestamp: Date.now(),
            roomId: 'room-' + Date.now()
        };
        
        const response = await fetch(`${BASE_URL}/.netlify/functions/call-management`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'store_call',
                callData: callData
            })
        });
        
        console.log('📞 Call Start Response Status:', response.status);
        const result = await response.json();
        console.log('📞 Call Start Result:', result);
        
        if (result.success) {
            // Test incoming call check
            await testIncomingCallCheck(callData.recipientId);
            // Test call status check
            await testCallStatusCheck(callData.callId);
        }
        
        return callData.callId;
        
    } catch (error) {
        console.error('❌ Call Start Error:', error);
    }
}

// Test incoming call check
async function testIncomingCallCheck(userId) {
    console.log('🧪 Testing Incoming Call Check...');
    
    try {
        const response = await fetch(`${BASE_URL}/.netlify/functions/call-management`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'check_incoming_calls',
                userId: userId
            })
        });
        
        console.log('📞 Incoming Call Response Status:', response.status);
        const result = await response.json();
        console.log('📞 Incoming Call Result:', result);
        
    } catch (error) {
        console.error('❌ Incoming Call Error:', error);
    }
}

// Test call status check
async function testCallStatusCheck(callId) {
    console.log('🧪 Testing Call Status Check...');
    
    try {
        const response = await fetch(`${BASE_URL}/.netlify/functions/call-management`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'check_call_status',
                callId: callId
            })
        });
        
        console.log('📞 Call Status Response Status:', response.status);
        const result = await response.json();
        console.log('📞 Call Status Result:', result);
        
    } catch (error) {
        console.error('❌ Call Status Error:', error);
    }
}

// Test call acceptance
async function testCallAccept(callId) {
    console.log('🧪 Testing Call Accept...');
    
    try {
        const response = await fetch(`${BASE_URL}/.netlify/functions/call-management`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'accept_call',
                callId: callId
            })
        });
        
        console.log('📞 Call Accept Response Status:', response.status);
        const result = await response.json();
        console.log('📞 Call Accept Result:', result);
        
    } catch (error) {
        console.error('❌ Call Accept Error:', error);
    }
}

// Run tests
async function runCallTests() {
    console.log('🧪 CALL FUNCTIONALITY TEST SUITE');
    console.log('=================================');
    
    const callId = await testCallStart();
    
    if (callId) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        await testCallAccept(callId);
    }
}

runCallTests().catch(console.error);
