import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
    port: process.env.PORT || 3001,
    // Using file-based storage instead of MongoDB
    dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data'),
    uploadsDir: process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'),
    jwtSecret: process.env.JWT_SECRET || 'sk_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c',
    sessionSecret: process.env.SESSION_SECRET || 'ss_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0',
    tls: {
        key: process.env.TLS_KEY || path.join(process.cwd(), 'certs', 'key.pem'),
        cert: process.env.TLS_CERT || path.join(process.cwd(), 'certs', 'cert.pem'),
    },
    alertThreshold: process.env.ALERT_THRESHOLD || 5,
    // Media and file upload settings
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
    allowedFileTypes: {
        images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        videos: ['.mp4', '.webm', '.mov', '.avi'],
        documents: ['.pdf', '.doc', '.docx', '.txt'],
        audio: ['.mp3', '.wav', '.ogg', '.m4a']
    },
    // WebRTC configuration for video calls
    webrtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }
};

export default config;

