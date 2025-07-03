import crypto from 'crypto';
import { AES512 } from './aes512';
import { ASH512 } from './ash512';

export class KeyManager {
    private keys: Map<string, Buffer>;
    private keyDerivationSalts: Map<string, Buffer>;

    constructor() {
        this.keys = new Map();
        this.keyDerivationSalts = new Map();
    }

    /**
     * Generate a secure 512-bit AES key
     * @param identifier - Key identifier
     * @returns Generated key as hex string
     */
    generateKey(identifier: string): string {
        const key = this.createSecureAES512Key();
        this.keys.set(identifier, key);
        return key.toString('hex');
    }

    /**
     * Retrieve stored key
     * @param identifier - Key identifier
     * @returns Key buffer or undefined
     */
    retrieveKey(identifier: string): Buffer | undefined {
        return this.keys.get(identifier);
    }

    /**
     * Get or generate the main encryption key (512-bit)
     * @returns 512-bit encryption key
     */
    getEncryptionKey(): Buffer {
        let key = this.retrieveKey('encryption');
        if (!key) {
            this.generateKey('encryption');
            key = this.retrieveKey('encryption')!;
        }
        return key;
    }

    /**
     * Derive a user-specific key from password
     * @param userId - User identifier
     * @param password - User password
     * @returns Derived 512-bit key
     */
    deriveUserKey(userId: string, password: string): Buffer {
        let salt = this.keyDerivationSalts.get(userId);
        if (!salt) {
            salt = AES512.generateSalt();
            this.keyDerivationSalts.set(userId, salt);
        }
        return AES512.deriveKey(password, salt);
    }

    /**
     * Generate session key for temporary communications
     * @param sessionId - Session identifier
     * @returns Session key
     */
    generateSessionKey(sessionId: string): Buffer {
        const sessionKey = this.createSecureAES512Key();
        this.keys.set(`session:${sessionId}`, sessionKey);
        return sessionKey;
    }

    /**
     * Create a secure random 512-bit key
     * @returns 512-bit key buffer
     */
    private createSecureAES512Key(): Buffer {
        return AES512.generateKey();
    }

    /**
     * Generate key fingerprint using ASH-512 for identification
     * @param key - Key to fingerprint
     * @returns ASH-512 hash of the key
     */
    generateKeyFingerprint(key: Buffer): string {
        return ASH512.hash(key).toString('hex').substring(0, 32); // First 32 chars for readability
    }

    /**
     * Rotate encryption key (generate new key)
     * @param identifier - Key identifier
     * @returns New key
     */
    rotateKey(identifier: string): string {
        this.deleteKey(identifier);
        return this.generateKey(identifier);
    }

    /**
     * Delete key from memory
     * @param identifier - Key identifier
     */
    deleteKey(identifier: string): void {
        // Securely zero out the key before deletion
        const key = this.keys.get(identifier);
        if (key) {
            key.fill(0);
        }
        this.keys.delete(identifier);
    }

    /**
     * Get all active key identifiers
     * @returns Array of key identifiers
     */
    getActiveKeys(): string[] {
        return Array.from(this.keys.keys());
    }

    /**
     * Clear all keys from memory (security cleanup)
     */
    clearAllKeys(): void {
        for (const [identifier, key] of this.keys) {
            key.fill(0); // Securely zero out
        }
        this.keys.clear();
        this.keyDerivationSalts.clear();
    }
}

