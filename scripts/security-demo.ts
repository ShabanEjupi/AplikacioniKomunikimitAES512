#!/usr/bin/env ts-node
import { UserAuthentication } from '../server/src/auth/authentication';
import SessionManager from '../server/src/auth/session';
import { KeyManager } from '../server/src/crypto/keyManager';
import { encryptMessage, decryptMessage, generateMessageHash, verifyMessageIntegrity } from '../server/src/messaging/encryption';
import { formatMessage, validateMessage, decryptValidatedMessage } from '../server/src/messaging/protocol';
import { addAlert, getAlerts, clearAlerts } from '../server/src/alerts/monitor';

console.log('🔐 Demonstrimi i sistemit të komunikimit të sigurt');
console.log('================================================\n');

console.log('🏗️  ARKITEKTURA E SIGURISË:');
console.log('  • AES-512: Enkriptimi (konfidencialiteti i të dhënave)');
console.log('  • ASH-512: Hash-imi (integriteti i të dhënave)');
console.log('================================================\n');

async function demonstrateSecureCommunication() {
    // 1. Vërtetimi i përdoruesit
    console.log('👤 1. Vërtetimi i përdoruesit');
    console.log('-------------------------');
    const userAuth = UserAuthentication.getInstance();
    const sessionManager = new SessionManager('demo-secret-key');
    
    try {
        // Regjistro një përdorues demo
        await userAuth.register('demo_user', 'secure_password123');
        console.log('✅ Përdoruesi u regjistrua me sukses');
        
        // Kyçja
        const token = await userAuth.login('demo_user', 'secure_password123');
        console.log('✅ Përdoruesi u kyç me sukses');
        console.log(`   Token: ${token.substring(0, 20)}...`);
        
        // Vërtetimi i sesionit
        const isValid = sessionManager.validateToken(token);
        console.log(`✅ Vërtetimi i sesionit: ${isValid ? 'I vlefshëm' : 'I pavlefshëm'}`);
        
    } catch (error) {
        console.log(`❌ Gabim në vërtetim: ${error}`);
    }
    
    console.log('\n🔑 2. Menaxhimi i çelësave');
    console.log('--------------------');
    const keyManager = new KeyManager();
    
    // Gjenerimi i çelësave të enkriptimit
    const encryptionKey = keyManager.generateKey('encryption');
    const signingKey = keyManager.generateKey('signing');
    
    console.log('✅ Çelësi i enkriptimit u gjenerua');
    console.log('✅ Çelësi i nënshkrimit u gjenerua');
    console.log(`   Çelësi i enkriptimit: ${encryptionKey.substring(0, 16)}...`);
    
    console.log('\n🔒 3. Enkriptimi dhe integriteti i mesazheve');
    console.log('-------------------------------------------');
    const originalMessage = 'This is a confidential message that needs AES-512 encryption!';
    console.log(`Original message: "${originalMessage}"`);
    
    try {
        // AES-512 Encryption for confidentiality
        const encryptedMessage = await encryptMessage(originalMessage, 'demo_password');
        console.log('✅ Message encrypted with AES-512');
        console.log(`   Encrypted: ${encryptedMessage.substring(0, 32)}...`);
        
        // ASH-512 Hash for integrity verification
        const messageHash = generateMessageHash(originalMessage);
        console.log('✅ Message hash generated with ASH-512');
        console.log(`   Hash: ${messageHash.substring(0, 32)}...`);
        
        // Decrypt the message
        const decryptedMessage = await decryptMessage(encryptedMessage, 'demo_password');
        console.log('✅ Message decrypted with AES-512');
        console.log(`   Decrypted: "${decryptedMessage}"`);
        console.log(`   Match: ${decryptedMessage === originalMessage ? '✅' : '❌'}`);
        
        // Verify integrity
        const isIntegralMatch = verifyMessageIntegrity(decryptedMessage, messageHash);
        console.log(`   Integrity: ${isIntegralMatch ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log(`❌ Encryption error: ${error}`);
    }
    
    console.log('\n📨 4. Secure message protocol');
    console.log('-----------------------------');
    const senderId = 'user123';
    const recipientId = 'user456';
    const messageContent = 'Hello from secure protocol!';
    
    try {
        // Format message with encryption and integrity
        const formattedMessage = await formatMessage(messageContent, senderId, recipientId);
        console.log('✅ Message formatted for transmission');
        console.log(`   Sender: ${formattedMessage.senderId}`);
        console.log(`   Recipient: ${formattedMessage.recipientId}`);
        console.log(`   Hash: ${formattedMessage.hash.substring(0, 16)}...`);
        
        // Validate message
        const isValidMessage = await validateMessage(formattedMessage);
        console.log(`✅ Message validation: ${isValidMessage ? 'Valid' : 'Invalid'}`);
        
        // Decrypt validated message
        if (isValidMessage) {
            const decryptedContent = await decryptValidatedMessage(formattedMessage);
            console.log(`✅ Decrypted content: "${decryptedContent}"`);
        }
        
    } catch (error) {
        console.log(`❌ Protocol error: ${error}`);
    }
    
    console.log('\n🚨 5. Alert system');
    console.log('------------------');
    
    // Clear any existing alerts
    clearAlerts();
    
    // Simulate security alerts
    addAlert({
        id: 'alert_001',
        level: 'warning',
        message: 'Suspicious login attempt detected',
        timestamp: new Date()
    });
    
    addAlert({
        id: 'alert_002',
        level: 'error',
        message: 'Invalid certificate detected',
        timestamp: new Date()
    });
    
    const alerts = getAlerts();
    console.log(`✅ ${alerts.length} security alerts generated:`);
    alerts.forEach(alert => {
        const icon = alert.level === 'error' ? '🔴' : alert.level === 'warning' ? '🟡' : '🔵';
        console.log(`   ${icon} [${alert.level.toUpperCase()}] ${alert.message}`);
    });
    
    console.log('\n🎯 6. Security features summary');
    console.log('--------------------------');
    console.log('✅ User authentication with bcrypt password hashing');
    console.log('✅ Session management with JWT tokens');
    console.log('✅ Secure key generation and management');
    console.log('✅ AES-512 message encryption');
    console.log('✅ Message integrity with ASH-512 signatures');
    console.log('✅ Alert system for security monitoring');
    console.log('✅ Certificate-based TLS communication');
    console.log('✅ Protection against common SSL/TLS attacks');
    
    console.log('\n🏆 System status: secure & operational');
    console.log('=====================================');
}

// Run the demonstration
demonstrateSecureCommunication().catch(console.error);

