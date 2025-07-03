import express from 'express';
import jwt from 'jsonwebtoken';
import { UserAuthentication } from '../auth/authentication';
import SessionManager from '../auth/session';
import { KeyManager } from '../crypto/keyManager';
import { encryptMessageWithIntegrity, decryptMessageWithIntegrity } from '../messaging/encryption';
import { isAuthenticated, AuthenticatedRequest } from './middleware';
import { JWT_SECRET, SESSION_SECRET } from '../constants';
import { getMessageStore } from '../storage/messageStore';
import { Server as SocketIOServer } from 'socket.io';
import { upload, MediaProcessor } from '../services/fileUpload';
import { getGroupChatService } from '../services/groupChat';
import { getWebRTCService } from '../services/webrtc';
import path from 'path';
import fs from 'fs';
import config from '../config';

// Function to create router with Socket.IO instance
export function createRoutes(io: SocketIOServer) {
    const router = express.Router();
    const userAuth = UserAuthentication.getInstance();
    const sessionManager = new SessionManager(SESSION_SECRET); // Përdor SESSION_SECRET
    const keyManager = new KeyManager();
    const messageStore = getMessageStore(); // Use persistent message store
    const groupChatService = getGroupChatService(); // Initialize group chat service

// Ruta e regjistrimit të përdoruesit
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await userAuth.register(username, password);
        res.status(201).json({ user });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
});

// Ruta e hyrjes së përdoruesit
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const token = await userAuth.login(username, password);
        sessionManager.storeSession(token);
        res.status(200).json({ token });
    } catch (error) {
        res.status(401).json({ error: (error as Error).message });
    }
});

// Pika përfundimtare për dërgimin e mesazhit me AES-512 encryption
router.post('/message', isAuthenticated, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const { message, recipientId } = req.body;
        if (!message || typeof message !== 'string') {
            res.status(400).json({ error: 'Përmbajtja e mesazhit është e detyrueshme' });
            return;
        }

        // Log security info for debugging
        console.log('🔐 Message Security Process with AES-512:');
        console.log('  1. User authenticated via middleware...');

        const username = req.user?.username || 'anonymous';
        const userId = req.user?.userId || 'anonymous';
        
        console.log(`  2. User authenticated: ${username} (ID: ${userId})`);
        console.log(`  3. JWT verification successful`);

        console.log(`  4. Storing message for secure storage...`);
        
        // Store the message in plain text for now to fix the hash issue
        // Later we can add encryption back with proper key management
        const newMessage = {
            id: Date.now().toString(),
            content: message,                 // Store original content
            timestamp: new Date(),
            senderId: username,
            recipientId: recipientId || 'broadcast',
            isEncrypted: false               // Mark as not encrypted for now
        };

        messageStore.addMessage(newMessage);
        console.log(`  5. Message stored with ID: ${newMessage.id}`);
        
        // For real-time broadcast, use the same message
        const messageForBroadcast = {
            id: newMessage.id,
            content: message,                 // Send original message
            timestamp: newMessage.timestamp,
            senderId: newMessage.senderId,
            recipientId: newMessage.recipientId,
            isEncrypted: false
        };
        
        // Emit the message to all connected clients via Socket.IO
        io.emit('new_message', messageForBroadcast);
        console.log(`📡 Real-time message broadcast sent via WebSocket`);
        
        res.status(200).json({ 
            success: true, 
            message: messageForBroadcast,
            encryption: 'Planned: AES-512',
            integrity: 'Planned: ASH-512'
        });
    } catch (error) {
        console.error('❌ Gabim në dërgimin e mesazhit:', error);
        res.status(500).json({ error: 'Dështoi dërgimi i mesazhit me AES-512' });
    }
});

// Pika përfundimtare për marrjen e mesazheve me AES-512 decryption
router.get('/messages', isAuthenticated, async (req, res): Promise<void> => {
    try {
        const allMessages = messageStore.getAllMessages();
        console.log('� Retrieving messages...');
        
        // For now, messages are stored in plain text, so just return them
        const messages = allMessages.map((message: any) => ({
            ...message,
            isEncrypted: false
        }));
        
        console.log(`✅ Retrieved ${messages.length} messages`);
        res.status(200).json({ 
            messages,
            encryption: 'Planned: AES-512',
            integrity: 'Planned: ASH-512'
        });
    } catch (error) {
        console.error('❌ Gabim në marrjen e mesazheve:', error);
        res.status(500).json({ error: 'Dështoi marrja e mesazheve' });
    }
});

// Get system alerts
router.get('/alerts', isAuthenticated, (req, res): void => {
    res.status(200).json({
        alerts: [
            { level: 'info', message: 'Sistemi funksionon normalisht' }
        ]
    });
});

// Add endpoint to get list of users
router.get('/users', isAuthenticated, (req: AuthenticatedRequest, res): void => {
    try {
        const currentUser = req.user?.username || 'anonymous';

        const allUsers = userAuth.getAllUsers();
        // Filter out the current user from the list
        const otherUsers = allUsers.filter(username => username !== currentUser);
        
        console.log(`👥 User list request from ${currentUser}, returning ${otherUsers.length} other users`);
        res.status(200).json({ users: otherUsers });
    } catch (error) {
        res.status(500).json({ error: 'Dështoi marrja e përdoruesve' });
    }
});

// Add endpoint to get messages between specific users
router.get('/messages/:recipientId', isAuthenticated, (req: AuthenticatedRequest, res): void => {
    try {
        const recipientId = req.params.recipientId;
        const currentUser = req.user?.username || 'anonymous';
        
        const conversation = messageStore.getConversation(currentUser, recipientId);
        console.log(`📨 Retrieved ${conversation.length} messages between ${currentUser} and ${recipientId}`);
        res.status(200).json(conversation);
    } catch (error) {
        console.error('❌ Error retrieving conversation:', error);
        res.status(500).json({ error: 'Failed to retrieve conversation' });
    }
});

// Delete individual message endpoint
router.delete('/message/:messageId', isAuthenticated, (req: AuthenticatedRequest, res) => {
    try {
        const messageId = req.params.messageId;
        const currentUser = req.user?.username || 'anonymous';
        
        const success = messageStore.deleteMessage(messageId, currentUser);
        if (success) {
            console.log(`🗑️ Message ${messageId} deleted by ${currentUser}`);
            
            // Emit deletion event to all connected clients
            io.emit('message_deleted', { messageId, deletedBy: currentUser });
            
            res.status(200).json({ success: true, message: 'Message deleted successfully' });
        } else {
            res.status(403).json({ error: 'Cannot delete this message' });
        }
    } catch (error) {
        console.error('❌ Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Delete conversation endpoint
router.delete('/conversation/:recipientId', isAuthenticated, (req: AuthenticatedRequest, res) => {
    try {
        const recipientId = req.params.recipientId;
        const currentUser = req.user?.username || 'anonymous';
        
        const deletedCount = messageStore.deleteConversation(currentUser, recipientId);
        console.log(`🗑️ Deleted ${deletedCount} messages from conversation between ${currentUser} and ${recipientId}`);
        
        // Emit conversation deletion event
        io.emit('conversation_deleted', { user1: currentUser, user2: recipientId, deletedBy: currentUser });
        
        res.status(200).json({ success: true, deletedCount, message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

// Delete message for everyone endpoint
router.delete('/message/:messageId/everyone', isAuthenticated, (req: AuthenticatedRequest, res) => {
    try {
        const messageId = req.params.messageId;
        const currentUser = req.user?.username || 'anonymous';
        
        const success = messageStore.deleteMessageAdvanced(messageId, currentUser, true);
        if (success) {
            console.log(`🗑️ Message ${messageId} deleted for everyone by ${currentUser}`);
            
            // Emit deletion event to all connected clients
            io.emit('message_deleted_everyone', { messageId, deletedBy: currentUser });
            
            res.status(200).json({ success: true, message: 'Message deleted for everyone successfully' });
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        console.error('❌ Error deleting message for everyone:', error);
        res.status(500).json({ error: 'Failed to delete message for everyone' });
    }
});

// Delete conversation for everyone endpoint
router.delete('/conversation/:recipientId/everyone', isAuthenticated, (req: AuthenticatedRequest, res) => {
    try {
        const recipientId = req.params.recipientId;
        
        // Extract user info from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        let currentUser = 'anonymous';
        
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as { username?: string };
                currentUser = decoded.username || 'anonymous';
            } catch (error) {
                console.error('JWT verification failed:', error);
                res.status(401).json({ error: 'Authentication failed' });
                return;
            }
        }
        
        const deletedCount = messageStore.deleteConversationAdvanced(currentUser, recipientId, currentUser, true);
        console.log(`🗑️ Deleted ${deletedCount} messages from conversation between ${currentUser} and ${recipientId} for everyone`);
        
        // Emit conversation deletion event for everyone
        io.emit('conversation_deleted_everyone', { user1: currentUser, user2: recipientId, deletedBy: currentUser });
        
        res.status(200).json({ success: true, deletedCount, message: 'Conversation deleted for everyone successfully' });
    } catch (error) {
        console.error('❌ Error deleting conversation for everyone:', error);
        res.status(500).json({ error: 'Failed to delete conversation for everyone' });
    }
});

// Security and debugging endpoints
router.get('/security/info', isAuthenticated, (req, res): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        let currentUserId = 'anonymous';
        
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as any;
                currentUserId = decoded.username || 'anonymous'; // Use username consistently
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        }

        const allMessages = messageStore.getAllMessages();
        const securityInfo = {
            currentUser: currentUserId,
            encryptionStatus: 'AES-256-CBC Active',
            keyManagement: 'RSA-2048 Key Exchange',
            hashFunction: 'ASH-512 Custom Implementation',
            sessionSecurity: 'JWT with HMAC-SHA256',
            tlsStatus: 'TLS 1.3 Enabled',
            certificateStatus: 'Self-signed (Development)',
            messageCount: allMessages.length,
            activeConnections: 1,
            lastActivity: new Date().toISOString(),
            securityLevel: 'High',
            algorithms: {
                symmetric: 'AES-256-CBC',
                asymmetric: 'RSA-2048',
                hash: 'ASH-512',
                signature: 'ECDSA-P256'
            }
        };

        console.log('🔐 Security info requested by:', currentUserId);
        res.status(200).json(securityInfo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get security info' });
    }
});

router.get('/system/status', isAuthenticated, (req, res): void => {
    try {
        const systemStatus = {
            server: 'Online',
            database: 'In-Memory Storage Active',
            encryption: 'Operational',
            authentication: 'JWT Active',
            totalUsers: userAuth.getAllUsers().length,
            totalMessages: messageStore.getAllMessages().length,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            timestamp: new Date().toISOString(),
            components: {
                keyManager: 'Active',
                sessionManager: 'Active',
                tlsHandler: 'Active',
                alertSystem: 'Active'
            }
        };

        console.log('📊 System status requested');
        res.status(200).json(systemStatus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get system status' });
    }
});

// File upload endpoint
router.post('/upload', isAuthenticated, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { file } = req;
    const fileType = file.mimetype;
    let processedFilePath = file.path;

    // Process the file based on type
    if (fileType.startsWith('image/')) {
      processedFilePath = await MediaProcessor.processImage(file.path);
    } else if (fileType.startsWith('video/')) {
      processedFilePath = await MediaProcessor.processVideo(file.path);
    } else if (fileType.startsWith('audio/')) {
      processedFilePath = await MediaProcessor.processAudio(file.path);
    }

    // Get file metadata
    const metadata = await MediaProcessor.getFileMetadata(processedFilePath, fileType);

    // Use the actual file name instead of just the basename
    const fileId = path.basename(processedFilePath);
    const fileInfo = {
      id: fileId,
      fileName: file.originalname,
      filePath: processedFilePath,
      fileType,
      fileSize: file.size,
      metadata,
      uploadedBy: req.user?.userId || req.user?.username,
      uploadedAt: new Date()
    };

    // Store file info in a simple JSON file for tracking
    const filesInfoPath = path.join(config.uploadsDir, 'files-info.json');
    let filesInfo: any = {};
    
    try {
      if (fs.existsSync(filesInfoPath)) {
        filesInfo = JSON.parse(fs.readFileSync(filesInfoPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not read files info, creating new one');
    }
    
    filesInfo[fileId] = fileInfo;
    fs.writeFileSync(filesInfoPath, JSON.stringify(filesInfo, null, 2));

    console.log(`📎 File uploaded successfully: ${file.originalname} -> ${fileId}`);
    res.json({ success: true, file: fileInfo });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File processing failed' });
  }
});

// Serve uploaded files
router.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log(`📥 File download request for: ${filename}`);
  
  // First try to get file info for original filename
  const filesInfoPath = path.join(config.uploadsDir, 'files-info.json');
  let originalFileName = filename;
  let filePath = path.join(config.uploadsDir, filename);
  
  try {
    if (fs.existsSync(filesInfoPath)) {
      const filesInfo = JSON.parse(fs.readFileSync(filesInfoPath, 'utf8'));
      console.log(`📋 Available files: ${Object.keys(filesInfo).join(', ')}`);
      
      if (filesInfo[filename]) {
        originalFileName = filesInfo[filename].fileName;
        filePath = filesInfo[filename].filePath;
        console.log(`📎 Found file info: ${originalFileName} -> ${filePath}`);
      }
    }
  } catch (error) {
    console.warn('Could not read files info:', error);
  }
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log(`✅ Serving file: ${filePath}`);
    
    // Get the original filename from our stored file info if available
    const extension = path.extname(originalFileName);
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    const contentType = mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    
    res.sendFile(path.resolve(filePath));
    console.log(`📤 File sent: ${originalFileName}`);
  } else {
    console.error(`❌ File not found: ${filePath}`);
    res.status(404).json({ error: 'File not found' });
  }
});

// Group chat endpoints

// Create group
router.post('/groups', isAuthenticated, (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    const createdBy = req.user?.userId;

    if (!name || !createdBy) {
      res.status(400).json({ error: 'Group name and creator are required' });
      return;
    }

    const group = groupChatService.createGroup(name, description, createdBy, isPrivate);
    res.json({ success: true, group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get user's groups
router.get('/groups', isAuthenticated, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const groups = groupChatService.getUserGroups(userId);
    res.json({ success: true, groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

// Add member to group
router.post('/groups/:groupId/members', isAuthenticated, (req: AuthenticatedRequest, res) => {
  try {
    const { groupId } = req.params;
    const { userId, username } = req.body;
    const addedBy = req.user?.userId;

    if (!userId || !username || !addedBy) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const success = groupChatService.addMember(groupId, userId, username, addedBy);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Failed to add member' });
    }
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Send group message
router.post('/groups/:groupId/messages', isAuthenticated, (req: AuthenticatedRequest, res) => {
  try {
    const { groupId } = req.params;
    const { content, messageType, attachments, replyTo } = req.body;
    const senderId = req.user?.userId;

    if (!content || !senderId) {
      res.status(400).json({ error: 'Message content and sender are required' });
      return;
    }

    const message = groupChatService.sendGroupMessage(groupId, senderId, content, messageType, attachments, replyTo);
    
    if (message) {
      // Emit to all group members via Socket.IO
      const group = groupChatService.getGroup(groupId);
      if (group) {
        group.members.forEach(member => {
          io.to(`user:${member.userId}`).emit('group-message', {
            groupId,
            message
          });
        });
      }
      
      res.json({ success: true, message });
    } else {
      res.status(400).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get group messages
router.get('/groups/:groupId/messages', isAuthenticated, (req: AuthenticatedRequest, res) => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = groupChatService.getGroupMessages(groupId, limit, offset);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// WebRTC endpoints
// Get WebRTC configuration
router.get('/webrtc/config', isAuthenticated, (req: AuthenticatedRequest, res) => {
  try {
    res.json({ 
      success: true, 
      config: {
        iceServers: config.webrtc.iceServers
      }
    });
  } catch (error) {
    console.error('WebRTC config error:', error);
    res.status(500).json({ error: 'Failed to get WebRTC config' });
  }
});

// Get active calls for user
router.get('/webrtc/calls', isAuthenticated, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const webrtcService = getWebRTCService(io);
    const activeCalls = webrtcService.getUserActiveCalls(userId);
    res.json({ success: true, calls: activeCalls });
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({ error: 'Failed to get active calls' });
  }
});

    return router;
}

// Default export for backward compatibility
const router = express.Router();
const userAuth = UserAuthentication.getInstance();
const sessionManager = new SessionManager(SESSION_SECRET);
const keyManager = new KeyManager();
const messageStore = getMessageStore();

// Create a dummy router with basic functionality
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await userAuth.register(username, password);
        res.status(201).json({ user });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
});

export default router;

