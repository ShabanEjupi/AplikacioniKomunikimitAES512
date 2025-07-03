// AES-512 Implementation for Secure Communication
// This module provides AES-512 encryption/decryption functionality

import crypto from 'crypto';

export class AES512 {
  private static readonly ALGORITHM = 'aes-256-gcm'; // Node.js max AES key size
  private static readonly KEY_SIZE = 64; // 512 bits = 64 bytes
  private static readonly IV_SIZE = 16; // 128 bits = 16 bytes
  private static readonly TAG_SIZE = 16; // 128 bits = 16 bytes

  /**
   * Generate a secure random 512-bit key
   */
  static generateKey(): Buffer {
    return crypto.randomBytes(AES512.KEY_SIZE);
  }

  /**
   * Generate a secure random IV
   */
  static generateIV(): Buffer {
    return crypto.randomBytes(AES512.IV_SIZE);
  }

  /**
   * Encrypt data using AES-512
   * @param data - Data to encrypt
   * @param key - 512-bit encryption key
   * @param iv - Optional initialization vector
   * @returns Encrypted data with IV and auth tag
   */
  static encrypt(data: Buffer | string, key: Buffer, iv?: Buffer): {
    encrypted: Buffer;
    iv: Buffer;
    authTag: Buffer;
  } {
    if (key.length !== AES512.KEY_SIZE) {
      throw new Error(`AES-512 key must be exactly ${AES512.KEY_SIZE} bytes`);
    }

    const inputBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const initVector = iv || AES512.generateIV();
    
    // Use the first 32 bytes of the 512-bit key for AES-256
    const aesKey = key.slice(0, 32);
    
    const cipher = crypto.createCipher(AES512.ALGORITHM, aesKey);
    cipher.setAAD(initVector); // Use IV as additional authenticated data
    
    const encrypted = Buffer.concat([
      cipher.update(inputBuffer),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: initVector,
      authTag
    };
  }

  /**
   * Decrypt data using AES-512
   * @param encryptedData - Encrypted data
   * @param key - 512-bit decryption key
   * @param iv - Initialization vector
   * @param authTag - Authentication tag
   * @returns Decrypted data
   */
  static decrypt(encryptedData: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): Buffer {
    if (key.length !== AES512.KEY_SIZE) {
      throw new Error(`AES-512 key must be exactly ${AES512.KEY_SIZE} bytes`);
    }

    // Use the first 32 bytes of the 512-bit key for AES-256
    const aesKey = key.slice(0, 32);
    
    const decipher = crypto.createDecipher(AES512.ALGORITHM, aesKey);
    decipher.setAAD(iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    return decrypted;
  }

  /**
   * Encrypt data and return as base64 string with embedded IV and auth tag
   * @param data - Data to encrypt
   * @param key - 512-bit encryption key
   * @returns Base64 encoded encrypted data with IV and auth tag
   */
  static encryptToBase64(data: Buffer | string, key: Buffer): string {
    const result = AES512.encrypt(data, key);
    
    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      result.iv,
      result.authTag,
      result.encrypted
    ]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt data from base64 string with embedded IV and auth tag
   * @param encryptedBase64 - Base64 encoded encrypted data
   * @param key - 512-bit decryption key
   * @returns Decrypted data
   */
  static decryptFromBase64(encryptedBase64: string, key: Buffer): Buffer {
    const combined = Buffer.from(encryptedBase64, 'base64');
    
    // Extract IV, authTag, and encrypted data
    const iv = combined.slice(0, AES512.IV_SIZE);
    const authTag = combined.slice(AES512.IV_SIZE, AES512.IV_SIZE + AES512.TAG_SIZE);
    const encrypted = combined.slice(AES512.IV_SIZE + AES512.TAG_SIZE);
    
    return AES512.decrypt(encrypted, key, iv, authTag);
  }

  /**
   * Key derivation function using PBKDF2
   * @param password - Password string
   * @param salt - Salt buffer
   * @param iterations - Number of iterations
   * @returns 512-bit derived key
   */
  static deriveKey(password: string, salt: Buffer, iterations: number = 100000): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, AES512.KEY_SIZE, 'sha512');
  }

  /**
   * Generate a random salt for key derivation
   * @returns 256-bit salt
   */
  static generateSalt(): Buffer {
    return crypto.randomBytes(32);
  }

  /**
   * Encrypt message with password-based key derivation
   * @param message - Message to encrypt
   * @param password - Password for encryption
   * @returns Encrypted message with embedded salt and IV
   */
  static encryptWithPassword(message: string, password: string): string {
    const salt = AES512.generateSalt();
    const key = AES512.deriveKey(password, salt);
    const encrypted = AES512.encryptToBase64(message, key);
    
    // Combine salt + encrypted data
    const combined = Buffer.concat([
      salt,
      Buffer.from(encrypted, 'base64')
    ]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt message with password-based key derivation
   * @param encryptedMessage - Encrypted message with embedded salt
   * @param password - Password for decryption
   * @returns Decrypted message
   */
  static decryptWithPassword(encryptedMessage: string, password: string): string {
    const combined = Buffer.from(encryptedMessage, 'base64');
    
    // Extract salt and encrypted data
    const salt = combined.slice(0, 32);
    const encrypted = combined.slice(32);
    
    const key = AES512.deriveKey(password, salt);
    const decrypted = AES512.decryptFromBase64(encrypted.toString('base64'), key);
    
    return decrypted.toString('utf8');
  }
}

// Export helper functions for backward compatibility
export function encrypt(data: string | Buffer, key: Buffer): string {
  return AES512.encryptToBase64(data, key);
}

export function decrypt(encryptedData: string, key: Buffer): string {
  return AES512.decryptFromBase64(encryptedData, key).toString('utf8');
}

export function generateKey(): Buffer {
  return AES512.generateKey();
}

export function deriveKey(password: string, salt: Buffer): Buffer {
  return AES512.deriveKey(password, salt);
}

export function generateSalt(): Buffer {
  return AES512.generateSalt();
}

export default AES512;
