import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io';
import * as https from 'https';
import * as fs from 'fs';
import * as tls from 'tls';
import path from 'path';
// Korrigjo deklaratat e importit për të përputhur llojet e eksportit
import SessionManager from './auth/session';
import { UserAuthentication } from './auth/authentication';
import { KeyManager } from './crypto/keyManager';
import { startServer } from './crypto/tls';
import { createRoutes } from './api/routes';
import { monitorAlerts } from './alerts/monitor';
import { getWebRTCService } from './services/webrtc';
import config from './config/index';
import { SESSION_SECRET } from './constants';

// Extend Socket interface to include user properties
interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

// Krijo aplikacionin Express
const app = express();
const PORT = Number(config.port || 3001); // Konverto në numër në mënyrë eksplicite

// Konfigurimi i CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3005', 'https://localhost:3001', 'http://localhost:3003', 'http://localhost:3100'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Konfiguro https me tls
const tlsOptions: https.ServerOptions = {
  key: fs.readFileSync('certs/key.pem'),
  cert: fs.readFileSync('certs/cert.pem'),
  // Përdor një specifikim versioni tls të përputhshëm
  minVersion: tls.DEFAULT_MIN_VERSION
};

// Krijo serverët http dhe https
const httpServer = http.createServer(app);
const httpsServer = https.createServer(tlsOptions, app);

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());

// Konfiguro Socket.IO për komunikim në kohë reale - përdor HTTP server për development
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
  }
});

io.on('connection', (socket: AuthenticatedSocket) => {
  console.log('🔌 New user connected to real-time messaging');
  
  // User authentication for socket
  socket.on('authenticate', (data) => {
    const { userId, username } = data;
    socket.userId = userId;
    socket.username = username;
    console.log(`👤 User authenticated: ${username} (${userId})`);
    console.log(`🔗 Active sockets: ${Array.from(io.sockets.sockets.values()).map((s: AuthenticatedSocket) => s.username || s.userId || 'unnamed').join(', ')}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected from real-time messaging');
    // Note: WebRTC disconnection handling will be simpler for now
  });
  
  // Basic chat messaging
  socket.on('chat message', (msg) => {
    console.log('📨 Real-time message received:', msg);
    io.emit('chat message', msg);
  });
  
  // File sharing
  socket.on('file_shared', (data) => {
    console.log('📎 File shared:', data.fileName);
    socket.broadcast.emit('file_shared', {
      ...data,
      sharedBy: socket.username || 'Unknown',
      timestamp: new Date()
    });
  });
  
  // WebRTC signaling for video calls
  socket.on('call_initiate', (data) => {
    const { calleeId, type } = data;
    console.log(`📞 ${type} call initiated from ${socket.userId || socket.username} to ${calleeId}`);
    console.log(`🔍 Looking for user ${calleeId} among active sockets:`);
    
    const activeSockets = Array.from(io.sockets.sockets.values());
    activeSockets.forEach((s: AuthenticatedSocket, index) => {
      console.log(`  ${index + 1}: userId=${s.userId}, username=${s.username}`);
    });
    
    // Find the callee's socket by username (since calleeId is the username)
    const calleeSocket = activeSockets
      .find((s: AuthenticatedSocket) => s.username === calleeId || s.userId === calleeId);
    
    if (calleeSocket) {
      console.log(`📞 Found callee socket, sending call invitation`);
      calleeSocket.emit('incoming_call', {
        callerId: socket.userId || socket.username,
        callerName: socket.username,
        type,
        callId: `call_${Date.now()}`
      });
    } else {
      console.log(`❌ Callee ${calleeId} not found or not online`);
    }
  });
  
  socket.on('call_accept', (data) => {
    const { callerId, callId } = data;
    console.log(`✅ Call accepted by ${socket.userId || socket.username}`);
    
    const callerSocket = Array.from(io.sockets.sockets.values())
      .find((s: AuthenticatedSocket) => s.userId === callerId || s.username === callerId);
    
    if (callerSocket) {
      callerSocket.emit('call_accepted', {
        calleeId: socket.userId || socket.username,
        calleeName: socket.username,
        callId
      });
    }
  });
  
  socket.on('call_reject', (data) => {
    const { callerId } = data;
    console.log(`❌ Call rejected by ${socket.userId || socket.username}`);
    
    const callerSocket = Array.from(io.sockets.sockets.values())
      .find((s: AuthenticatedSocket) => s.userId === callerId || s.username === callerId);
    
    if (callerSocket) {
      callerSocket.emit('call_rejected', {
        calleeId: socket.userId || socket.username,
        calleeName: socket.username
      });
    }
  });
  
  socket.on('call_end', (data) => {
    const { otherUserId } = data;
    console.log(`📞 Call ended by ${socket.userId || socket.username}`);
    
    const otherSocket = Array.from(io.sockets.sockets.values())
      .find((s: AuthenticatedSocket) => s.userId === otherUserId || s.username === otherUserId);
    
    if (otherSocket) {
      otherSocket.emit('call_ended', {
        endedBy: socket.userId || socket.username
      });
    }
  });
  
  // WebRTC signaling
  socket.on('webrtc_offer', (data) => {
    const { targetUserId, offer } = data;
    const targetSocket = Array.from(io.sockets.sockets.values())
      .find((s: AuthenticatedSocket) => s.userId === targetUserId || s.username === targetUserId);
    
    if (targetSocket) {
      targetSocket.emit('webrtc_offer', {
        fromUserId: socket.userId || socket.username,
        offer
      });
    }
  });
  
  socket.on('webrtc_answer', (data) => {
    const { targetUserId, answer } = data;
    const targetSocket = Array.from(io.sockets.sockets.values())
      .find((s: AuthenticatedSocket) => s.userId === targetUserId || s.username === targetUserId);
    
    if (targetSocket) {
      targetSocket.emit('webrtc_answer', {
        fromUserId: socket.userId || socket.username,
        answer
      });
    }
  });
  
  socket.on('webrtc_ice_candidate', (data) => {
    const { targetUserId, candidate } = data;
    const targetSocket = Array.from(io.sockets.sockets.values())
      .find((s: AuthenticatedSocket) => s.userId === targetUserId || s.username === targetUserId);
    
    if (targetSocket) {
      targetSocket.emit('webrtc_ice_candidate', {
        fromUserId: socket.userId || socket.username,
        candidate
      });
    }
  });
  
  // Emoji reactions
  socket.on('emoji_reaction', (data) => {
    console.log('😀 Emoji reaction:', data);
    socket.broadcast.emit('emoji_reaction', {
      ...data,
      fromUser: socket.username || 'Unknown',
      timestamp: new Date()
    });
  });
});

// Create router with Socket.IO instance and use it
const router = createRoutes(io);
app.use('/api', router);

// Sherbe filat statik nga aplikacioni React
app.use(express.static(path.join(__dirname, '../../client/build')));

// "Catchall" handler: per cdo kerkese qe nuk perputhet me nje me siper, dergo prapa skedarin index.html te React.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build/index.html'));
});

// Vërtetimi i përdoruesit dhe menaxhimi i sesioneve  
const userAuth = UserAuthentication.getInstance();
const sessionManager = new SessionManager(SESSION_SECRET);
const keyManager = new KeyManager();

// Nis serverët
httpServer.listen(PORT, () => {
  console.log(`Serveri http po funksionon në http://localhost:${PORT}`);
});

const httpsPort = PORT + 1;
httpsServer.listen(httpsPort, () => {
  console.log(`Serveri https po funksionon në https://localhost:${httpsPort}`);
});

// Nis tls server-in
startServer(PORT + 2, 'certs/cert.pem', 'certs/key.pem').catch(console.error);

// Nis monitorimin e alarmeve
monitorAlerts();

// Menaxho ndalimin e procesit
process.on('SIGINT', () => {
  console.log('Duke mbyllur serverin...');
  httpServer.close();
  httpsServer.close();
  process.exit(0);
});

// Trajtimi i gabimeve të pazgjedhshme
process.on('uncaughtException', (error) => {
  console.error('Gabim i pazgjedhshëm:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Refuzimi i pashfrytëzuar:', reason);
  process.exit(1);
});
