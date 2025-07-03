export const KEY_SIZES = {
    aes: 256,
    rsa: 2048,
    ecc: 256,
};

export const HASH_ALGORITHMS = {
    ash512: 'ash-512',
    sha256: 'sha-256',
    sha512: 'sha-512',
};

export const TLS_VERSIONS = {
    tls_1_0: 'TLSv1.0',
    tls_1_1: 'TLSv1.1',
    tls_1_2: 'TLSv1.2',
    tls_1_3: 'TLSv1.3',
};

export const DEFAULT_TIMEOUT = 30000; // 30 sekonda

export const ALERT_LEVELS = {
    info: 'info',
    warning: 'warning',
    error: 'error',
};

export const AES_KEY_LENGTH = 32;
export const IV_LENGTH = 16;

// Çelësi i sigurt sekret - zëvendëso me variabël mjedisi në prodhim
export const JWT_SECRET = 'sk_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c';
export const SESSION_SECRET = 'ss_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0';

