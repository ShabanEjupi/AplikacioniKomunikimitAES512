#!/usr/bin/env node

/**
 * 🧪 File Upload Testing Script
 * Tests file upload, download, and preview functionality
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://cryptocall.netlify.app';

// Test file upload
async function testFileUpload() {
    console.log('🧪 Testing File Upload...');
    
    try {
        // Create a simple test file
        const testContent = 'This is a test file for upload';
        const testFile = Buffer.from(testContent).toString('base64');
        
        const response = await fetch(`${BASE_URL}/.netlify/functions/file-storage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileName: 'test-file.txt',
                fileType: 'text/plain',
                fileSize: testContent.length,
                fileData: testFile,
                senderId: 'test-user-123',
                encryptionKey: 'test-key'
            })
        });
        
        console.log('📤 Upload Response Status:', response.status);
        const result = await response.json();
        console.log('📤 Upload Result:', result);
        
        if (result.fileId) {
            // Test download
            await testFileDownload(result.fileId);
        }
        
    } catch (error) {
        console.error('❌ Upload Error:', error);
    }
}

// Test file download
async function testFileDownload(fileId) {
    console.log('🧪 Testing File Download...');
    
    try {
        const response = await fetch(`${BASE_URL}/.netlify/functions/file-storage?fileId=${fileId}&download=true`);
        console.log('📥 Download Response Status:', response.status);
        console.log('📥 Download Headers:', response.headers.get('content-type'));
        
        const content = await response.text();
        console.log('📥 Downloaded Content Length:', content.length);
        
    } catch (error) {
        console.error('❌ Download Error:', error);
    }
}

// Test file preview
async function testFilePreview(fileId) {
    console.log('🧪 Testing File Preview...');
    
    try {
        const response = await fetch(`${BASE_URL}/.netlify/functions/file-storage?fileId=${fileId}`);
        console.log('👁️ Preview Response Status:', response.status);
        
        const result = await response.json();
        console.log('👁️ Preview Result:', result);
        
    } catch (error) {
        console.error('❌ Preview Error:', error);
    }
}

// Run tests
testFileUpload().catch(console.error);
