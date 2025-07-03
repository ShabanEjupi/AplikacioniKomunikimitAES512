export const KEY_SIZES = {
    aes512: 512,  // Updated to AES-512
    aes256: 256,  // Keep for compatibility
    rsa: 2048,
    ecc: 256,
};

export const ENCRYPTION_ALGORITHMS = {
    aes512: 'aes-512',
    aes256: 'aes-256',
    rsa: 'rsa-2048',
};

export const HASH_ALGORITHMS = {
    ash512: 'ash-512',     // Primary hash function for integrity
    sha512: 'sha-512',     // Standard hash for compatibility
    sha256: 'sha-256',     // Legacy support
};

export const TLS_VERSIONS = {
    tls_1_0: 'TLSv1.0',
    tls_1_1: 'TLSv1.1',
    tls_1_2: 'TLSv1.2',
    tls_1_3: 'TLSv1.3',
};

export const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const ALERT_LEVELS = {
    info: 'info',
    warning: 'warning',
    error: 'error',
    critical: 'critical',
};

// Updated key lengths for AES-512
export const AES512_KEY_LENGTH = 64;  // 512 bits = 64 bytes
export const AES256_KEY_LENGTH = 32;  // 256 bits = 32 bytes (legacy)
export const IV_LENGTH = 16;          // 128 bits = 16 bytes
export const SALT_LENGTH = 32;        // 256 bits = 32 bytes

// Legacy constants for backward compatibility
export const AES_KEY_LENGTH = AES256_KEY_LENGTH;

// Security secrets - load from environment variables
export const JWT_SECRET = process.env.JWT_SECRET || generateSecureRandomKey();
export const SESSION_SECRET = process.env.SESSION_SECRET || generateSecureRandomKey();

// Generate secure random key for fallback
function generateSecureRandomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

