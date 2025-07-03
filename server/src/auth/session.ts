import Jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../constants';

class SessionManager {
    private sessions: Map<string, string>;
    private secretKey: string;

    constructor(secretKey: string) {
        this.sessions = new Map();
        this.secretKey = secretKey;
    }

    storeSession(token: string, userId?: string): void {
        if (userId) {
            this.sessions.set(token, userId);
        } else {
            // Extract userId from token if not provided
            try {
                const decoded = Jwt.verify(token, JWT_SECRET) as { userId?: string }; // Use JWT_SECRET
                if (decoded.userId) {
                    this.sessions.set(token, decoded.userId);
                }
            } catch (error) {
                console.error('Token i pavlefshëm:', error);
            }
        }
    }

    validateToken(token: string): boolean {
        try {
            Jwt.verify(token, JWT_SECRET); // Use JWT_SECRET instead of this.secretKey
            return true;
        } catch {
            return false;
        }
    }

    getSession(token: string): string | undefined {
        return this.sessions.get(token);
    }

    removeSession(token: string): void {
        this.sessions.delete(token);
    }
}

export default SessionManager;

