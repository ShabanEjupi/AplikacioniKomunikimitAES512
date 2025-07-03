import { v4 as uuidv4 } from 'uuid';

export default class SessionManager {
    private sessions: Map<string, string>;
    private currentToken: string | null = null;
    private static instance: SessionManager;

    constructor() {
        this.sessions = new Map();
        // Load token from localStorage during initialization and set it as current
        const storedToken = localStorage.getItem('session_token');
        if (storedToken) {
            this.currentToken = storedToken;
            console.log('🔄 Session restored from localStorage');
        }
    }

    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    createSession(userId: string): string {
        const sessionToken = uuidv4();
        this.sessions.set(sessionToken, userId);
        this.currentToken = sessionToken;
        return sessionToken;
    }

    storeToken(token: string): void {
        this.currentToken = token;
        // Gjithashtu ruaj në localStorage për përsistencë
        localStorage.setItem('session_token', token);
        console.log('✅ Token stored successfully:', token.substring(0, 20) + '...');
    }

    getToken(): string | null {
        // Try current token first, then localStorage, ensuring consistency
        if (!this.currentToken) {
            this.currentToken = localStorage.getItem('session_token');
        }
        return this.currentToken;
    }

    getSessionToken(): string | null {
        return this.getToken();
    }

    getUserId(sessionToken: string): string | null {
        return this.sessions.get(sessionToken) || null;
    }

    invalidateSession(sessionToken: string): void {
        this.sessions.delete(sessionToken);
        if (this.currentToken === sessionToken) {
            this.currentToken = null;
            localStorage.removeItem('session_token');
            console.log('🚪 Session invalidated and removed from storage');
        }
    }

    isValidSession(sessionToken: string): boolean {
        return this.sessions.has(sessionToken);
    }

    // Check if token exists and appears valid (just check existence, not validation)
    hasValidToken(): boolean {
        const token = this.getToken();
        return token !== null && token.length > 20; // JWT tokens are typically longer than 20 chars
    }

    // Refresh token from localStorage if needed
    refreshTokenFromStorage(): boolean {
        const storedToken = localStorage.getItem('session_token');
        if (storedToken && storedToken !== this.currentToken) {
            this.currentToken = storedToken;
            console.log('🔄 Token refreshed from localStorage');
            return true;
        }
        return false;
    }
}

