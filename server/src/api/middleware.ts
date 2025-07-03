import { Request, Response, NextFunction } from 'express';
import SessionManager from '../auth/session';
import { JWT_SECRET, SESSION_SECRET } from '../constants';
import jwt from 'jsonwebtoken';

// Extended Request interface to include user info and file uploads
export interface AuthenticatedRequest extends Request {
    user?: {
        username: string;
        userId: string;
    };
    file?: any; // For multer file uploads
    files?: any; // For multer multiple file uploads
}

// Middleware for checking if the user is authenticated
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No authorization header found');
        res.status(401).json({ message: 'I paautorizuar' });
        return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
        // Verify JWT token and extract user info
        const decoded = jwt.verify(token, JWT_SECRET) as { username: string; userId?: string };
        
        // Attach user info to request object for use in routes
        req.user = {
            username: decoded.username,
            userId: decoded.userId || decoded.username
        };
        
        console.log('✅ Authentication successful for user:', decoded.username);
        next();
    } catch (error) {
        console.log('❌ Invalid token provided:', error);
        res.status(401).json({ message: 'Token i pavlefshëm' });
        return;
    }
};

// Middleware for validating request data
export const validateRequestData = (req: Request, res: Response, next: NextFunction): void => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ message: 'Emri i përdoruesit dhe fjalëkalimi janë të detyrueshëm' });
        return; // Important: return void
    }
    next();
};

