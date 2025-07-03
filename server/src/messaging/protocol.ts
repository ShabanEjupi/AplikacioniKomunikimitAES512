import { encryptMessage, decryptMessage, generateMessageHash } from './encryption';
import { ASH512 } from '../crypto/ash512';
import { randomBytes } from 'crypto';

// Local type definitions to avoid shared import issues
interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: Date;
    hash?: string;
}

interface EncryptedMessage {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: Date;
    hash: string;
}

/**
 * Generate a hash using ASH512 for integrity verification
 * @param data - The data to hash
 * @returns The hash as a hex string
 */
function generateHash(data: string): string {
    return ASH512.hash(Buffer.from(data, 'utf8')).toString('hex');
}

/**
 * Formats a message for transmission, including AES-512 encryption and ASH-512 hashing for integrity.
 * @param message - The message content to be sent.
 * @param senderId - The ID of the sender.
 * @param recipientId - The ID of the recipient.
 * @param userPassword - Optional user password for encryption
 * @returns The formatted encrypted message object.
 */
export async function formatMessage(message: string, senderId: string, recipientId: string, userPassword?: string): Promise<EncryptedMessage> {
    const messageId = randomBytes(16).toString('hex');
    
    // Use AES-512 for encryption (confidentiality)
    const encryptedContent = await encryptMessage(message, userPassword);
    
    // Use ASH-512 for integrity verification
    const hashedMessage = generateMessageHash(message);
    
    return {
        id: messageId,
        senderId,
        recipientId,
        content: encryptedContent,
        timestamp: new Date(),
        hash: hashedMessage,
    };
}

/**
 * Validates the integrity of a received message by comparing ASH-512 hashes and decrypting with AES-512.
 * @param receivedMessage - The encrypted message object received.
 * @param userPassword - Optional user password for decryption
 * @returns True if the message is valid, false otherwise.
 */
export async function validateMessage(receivedMessage: EncryptedMessage, userPassword?: string): Promise<boolean> {
    try {
        // Decrypt with AES-512
        const decryptedContent = await decryptMessage(receivedMessage.content, userPassword);
        
        // Verify integrity with ASH-512
        const hashedContent = generateMessageHash(decryptedContent);
        return hashedContent === receivedMessage.hash;
    } catch (error) {
        console.error('Error validating message:', error);
        return false;
    }
}

/**
 * Decrypts a message after validation using AES-512.
 * @param receivedMessage - The encrypted message object received.
 * @param userPassword - Optional user password for decryption
 * @returns The decrypted message content or null if invalid.
 */
export async function decryptValidatedMessage(receivedMessage: EncryptedMessage, userPassword?: string): Promise<string | null> {
    const isValid = await validateMessage(receivedMessage, userPassword);
    if (!isValid) {
        return null;
    }
    
    try {
        // Use AES-512 for decryption
        return await decryptMessage(receivedMessage.content, userPassword);
    } catch (error) {
        console.error('Error decrypting message:', error);
        return null;
    }
}

