export interface User {
    id: string;
    username: string;
    email: string;
}

export interface Session {
    token: string;
    userId: string;
    expiresAt: Date;
}

export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: Date;
}

export interface Alert {
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
}

export interface KeyPair {
    publicKey: string;
    privateKey: string;
}

