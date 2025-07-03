import { AES512 } from '../crypto/aes512';
import { ASH512 } from '../crypto/ash512'; // Keep for integrity checks
import { KeyManager } from '../crypto/keyManager';

const keyManager = new KeyManager();

export async function encryptMessage(message: string, userPassword?: string): Promise<string> {
    try {
        // Use user password if provided, otherwise use system key
        if (userPassword) {
            return AES512.encryptWithPassword(message, userPassword);
        } else {
            const key = keyManager.getEncryptionKey();
            // Use the key directly - KeyManager already generates 64-byte keys
            return AES512.encryptToBase64(message, key);
        }
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt message');
    }
}

export async function decryptMessage(encryptedMessage: string, userPassword?: string): Promise<string> {
    try {
        // Use user password if provided, otherwise use system key
        if (userPassword) {
            return AES512.decryptWithPassword(encryptedMessage, userPassword);
        } else {
            const key = keyManager.getEncryptionKey();
            // Use the key directly - KeyManager already generates 64-byte keys
            const decrypted = AES512.decryptFromBase64(encryptedMessage, key);
            return decrypted.toString('utf8');
        }
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt message');
    }
}

/**
 * Generate message integrity hash using ASH-512
 * This ensures message hasn't been tampered with
 * @param message - Original message
 * @returns ASH-512 hash for integrity verification
 */
export function generateMessageHash(message: string): string {
    return ASH512.hash(Buffer.from(message, 'utf8')).toString('hex');
}

/**
 * Verify message integrity using ASH-512 hash
 * @param message - Message to verify
 * @param expectedHash - Expected ASH-512 hash
 * @returns true if message is authentic
 */
export function verifyMessageIntegrity(message: string, expectedHash: string): boolean {
    const actualHash = generateMessageHash(message);
    return actualHash === expectedHash;
}

/**
 * Encrypt message with both confidentiality and integrity protection
 * @param message - Message to encrypt
 * @param userPassword - User password for encryption
 * @returns Object containing encrypted message and integrity hash
 */
export async function encryptMessageWithIntegrity(message: string, userPassword?: string): Promise<{
    encryptedMessage: string;
    integrityHash: string;
}> {
    const encryptedMessage = await encryptMessage(message, userPassword);
    const integrityHash = generateMessageHash(message);
    
    return {
        encryptedMessage,
        integrityHash
    };
}

/**
 * Decrypt message and verify integrity
 * @param encryptedMessage - Encrypted message
 * @param integrityHash - Expected integrity hash
 * @param userPassword - User password for decryption
 * @returns Decrypted message if authentic
 */
export async function decryptMessageWithIntegrity(
    encryptedMessage: string, 
    integrityHash: string, 
    userPassword?: string
): Promise<string> {
    const decryptedMessage = await decryptMessage(encryptedMessage, userPassword);
    
    if (!verifyMessageIntegrity(decryptedMessage, integrityHash)) {
        throw new Error('Message integrity verification failed - possible tampering detected');
    }
    
    return decryptedMessage;
}

