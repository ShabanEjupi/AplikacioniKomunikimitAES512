// Enhanced Security Module for Crypto 512
// Protects against advanced attacks including downgrade attacks

import crypto from 'crypto';
import { ASH512 } from '../crypto/ash512';

export interface SecurityConfig {
  minTlsVersion: string;
  maxTlsVersion: string;
  allowedCipherSuites: string[];
  sessionTimeout: number;
  maxLoginAttempts: number;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export class AdvancedSecurityManager {
  private config: SecurityConfig;
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }>;
  private rateLimitTracker: Map<string, { requests: number; windowStart: Date }>;
  private activeSessions: Map<string, { 
    userId: string; 
    created: Date; 
    lastAccess: Date;
    clientFingerprint: string;
    securityLevel: number;
  }>;
  private ash512: ASH512;

  constructor(config: SecurityConfig) {
    this.config = config;
    this.loginAttempts = new Map();
    this.rateLimitTracker = new Map();
    this.activeSessions = new Map();
    this.ash512 = new ASH512();
  }

  // Prevent downgrade attacks by enforcing minimum TLS version
  validateTlsVersion(tlsVersion: string): boolean {
    const versions: Record<string, number> = {
      'TLSv1.0': 1.0,
      'TLSv1.1': 1.1,
      'TLSv1.2': 1.2,
      'TLSv1.3': 1.3
    };

    const requestedVersion = versions[tlsVersion];
    const minVersion = versions[this.config.minTlsVersion];
    const maxVersion = versions[this.config.maxTlsVersion];

    return requestedVersion >= minVersion && requestedVersion <= maxVersion;
  }

  // Validate cipher suites to prevent weak cipher attacks
  validateCipherSuite(cipherSuite: string): boolean {
    return this.config.allowedCipherSuites.includes(cipherSuite);
  }

  // Advanced session management with security features
  createSecureSession(userId: string, clientInfo: any): string {
    const sessionId = this.generateSecureRandomId();
    const timestamp = Date.now();
    const clientFingerprint = this.generateClientFingerprint(clientInfo);
    
    // Create session with metadata
    const sessionData = {
      userId,
      created: new Date(),
      lastAccess: new Date(),
      clientFingerprint,
      securityLevel: this.calculateSecurityLevel(clientInfo)
    };

    this.activeSessions.set(sessionId, sessionData);
    
    // Create signed session token
    const sessionToken = this.signSessionToken(sessionId, timestamp, clientFingerprint);
    
    return sessionToken;
  }

  // Validate session with security checks
  validateSession(sessionToken: string, clientInfo: any): { valid: boolean; userId?: string } {
    try {
      const { sessionId, timestamp, signature, clientFingerprint } = this.parseSessionToken(sessionToken);
      
      // Verify signature
      if (!this.verifySessionSignature(sessionId, timestamp, clientFingerprint, signature)) {
        return { valid: false };
      }

      // Check session exists and is active
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        return { valid: false };
      }

      // Check session timeout
      const now = Date.now();
      const sessionAge = now - sessionData.lastAccess.getTime();
      if (sessionAge > this.config.sessionTimeout * 1000) {
        this.activeSessions.delete(sessionId);
        return { valid: false };
      }

      // Validate client fingerprint (prevents session hijacking)
      const currentFingerprint = this.generateClientFingerprint(clientInfo);
      if (currentFingerprint !== sessionData.clientFingerprint) {
        console.warn('🚨 Session hijacking attempt detected!');
        this.activeSessions.delete(sessionId);
        return { valid: false };
      }

      // Update last access time
      sessionData.lastAccess = new Date();
      this.activeSessions.set(sessionId, sessionData);

      return { valid: true, userId: sessionData.userId };
    } catch (error) {
      return { valid: false };
    }
  }

  // Brute force protection
  checkBruteForce(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier);
    
    if (!attempts) {
      return true; // First attempt
    }

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    const resetWindow = 15 * 60 * 1000; // 15 minutes

    // Reset counter if enough time has passed
    if (timeSinceLastAttempt > resetWindow) {
      this.loginAttempts.delete(identifier);
      return true;
    }

    // Check if max attempts exceeded
    return attempts.count < this.config.maxLoginAttempts;
  }

  // Record login attempt
  recordLoginAttempt(identifier: string, success: boolean): void {
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    
    if (success) {
      // Reset on successful login
      this.loginAttempts.delete(identifier);
    } else {
      attempts.count++;
      attempts.lastAttempt = new Date();
      this.loginAttempts.set(identifier, attempts);
    }
  }

  // Rate limiting protection
  checkRateLimit(clientId: string): boolean {
    const tracker = this.rateLimitTracker.get(clientId);
    const now = Date.now();
    
    if (!tracker) {
      this.rateLimitTracker.set(clientId, { requests: 1, windowStart: new Date() });
      return true;
    }

    const windowAge = now - tracker.windowStart.getTime();
    
    // Reset window if expired
    if (windowAge > this.config.rateLimitWindow * 1000) {
      this.rateLimitTracker.set(clientId, { requests: 1, windowStart: new Date() });
      return true;
    }

    // Check if limit exceeded
    if (tracker.requests >= this.config.rateLimitMax) {
      return false;
    }

    // Increment counter
    tracker.requests++;
    this.rateLimitTracker.set(clientId, tracker);
    return true;
  }

  // Generate secure random ID using ASH-512
  private generateSecureRandomId(): string {
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Buffer.from(Date.now().toString());
    const combined = Buffer.concat([randomBytes, timestamp]);
    
    return ASH512.hash(combined).toString('hex');
  }

  // Generate client fingerprint for session validation
  private generateClientFingerprint(clientInfo: any): string {
    const fingerprint = {
      userAgent: clientInfo.userAgent || '',
      acceptLanguage: clientInfo.acceptLanguage || '',
      acceptEncoding: clientInfo.acceptEncoding || '',
      ip: clientInfo.ip || '',
      // Add more fingerprinting data as needed
    };

    const fingerprintString = JSON.stringify(fingerprint);
    return ASH512.hash(Buffer.from(fingerprintString)).toString('hex');
  }

  // Calculate security level based on client info
  private calculateSecurityLevel(clientInfo: any): number {
    let score = 0;
    
    // TLS version check
    if (clientInfo.tlsVersion === 'TLSv1.3') score += 3;
    else if (clientInfo.tlsVersion === 'TLSv1.2') score += 2;
    else score += 1;

    // Cipher suite strength
    if (clientInfo.cipherSuite?.includes('AES256-GCM')) score += 2;
    else if (clientInfo.cipherSuite?.includes('AES128-GCM')) score += 1;

    // Additional security factors
    if (clientInfo.certificateVerified) score += 1;
    if (clientInfo.hsts) score += 1;

    return score;
  }

  // Sign session token with HMAC
  private signSessionToken(sessionId: string, timestamp: number, clientFingerprint: string): string {
    const payload = `${sessionId}.${timestamp}.${clientFingerprint}`;
    const secretKey = crypto.randomBytes(32); // In production, use a persistent secret
    const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
    
    return `${payload}.${signature}`;
  }

  // Parse session token
  private parseSessionToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 4) {
      throw new Error('Invalid session token format');
    }

    return {
      sessionId: parts[0],
      timestamp: parseInt(parts[1]),
      clientFingerprint: parts[2],
      signature: parts[3]
    };
  }

  // Verify session signature
  private verifySessionSignature(sessionId: string, timestamp: number, clientFingerprint: string, signature: string): boolean {
    const payload = `${sessionId}.${timestamp}.${clientFingerprint}`;
    const secretKey = crypto.randomBytes(32); // In production, use the same persistent secret
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  // Clean up expired sessions
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, sessionData] of this.activeSessions) {
      const sessionAge = now - sessionData.lastAccess.getTime();
      if (sessionAge > this.config.sessionTimeout * 1000) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });

    console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
  }

  // Get security statistics
  getSecurityStats(): any {
    return {
      activeSessions: this.activeSessions.size,
      loginAttempts: this.loginAttempts.size,
      rateLimitTrackers: this.rateLimitTracker.size,
      securityLevel: 'HIGH',
      protections: [
        'TLS Downgrade Protection',
        'Session Hijacking Prevention',
        'Brute Force Protection',
        'Rate Limiting',
        'Client Fingerprinting',
        'ASH-512 Hash Security'
      ]
    };
  }
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  minTlsVersion: 'TLSv1.2',
  maxTlsVersion: 'TLSv1.3',
  allowedCipherSuites: [
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES128-GCM-SHA256'
  ],
  sessionTimeout: 3600, // 1 hour
  maxLoginAttempts: 5,
  rateLimitWindow: 900, // 15 minutes
  rateLimitMax: 100
};
