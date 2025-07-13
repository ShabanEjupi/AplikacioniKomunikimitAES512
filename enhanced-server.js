#!/usr/bin/env node

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Import Netlify functions
const loginHandler = require('./netlify/functions/login').handler;
const registerHandler = require('./netlify/functions/register').handler;
const usersHandler = require('./netlify/functions/users').handler;
const messagesHandler = require('./netlify/functions/messages').handler;
const messageActionsHandler = require('./netlify/functions/message-actions').handler;
const fileStorageHandler = require('./netlify/functions/file-storage').handler;
const conversationHandler = require('./netlify/functions/conversation').handler;
const callManagementHandler = require('./netlify/functions/call-management').handler;
const healthCheckHandler = require('./netlify/functions/health-check').handler;
const systemStatusHandler = require('./netlify/functions/system-status').handler;
const registrationStatusHandler = require('./netlify/functions/registration-status').handler;
const securityInfoHandler = require('./netlify/functions/security-info').handler;

// Helper function to convert Express req/res to Netlify format
const adaptHandler = (handler) => {
  return async (req, res) => {
    const event = {
      httpMethod: req.method,
      path: req.path,
      queryStringParameters: req.query,
      headers: req.headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : null
    };

    const context = {};

    try {
      const result = await handler(event, context);
      
      // Set status code
      res.status(result.statusCode || 200);
      
      // Set headers
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.set(key, value);
        });
      }
      
      // Send body
      if (result.isBase64Encoded) {
        res.send(Buffer.from(result.body, 'base64'));
      } else {
        res.send(result.body);
      }
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// API routes
app.all('/api/login', adaptHandler(loginHandler));
app.all('/api/register', adaptHandler(registerHandler));
app.all('/api/users', adaptHandler(usersHandler));
app.all('/api/messages', adaptHandler(messagesHandler));
app.all('/api/message-actions', adaptHandler(messageActionsHandler));
app.all('/api/file-storage', adaptHandler(fileStorageHandler));
app.all('/api/conversation', adaptHandler(conversationHandler));
app.all('/api/call-management', adaptHandler(callManagementHandler));
app.all('/api/health', adaptHandler(healthCheckHandler));
app.all('/api/system-status', adaptHandler(systemStatusHandler));
app.all('/api/registration-status', adaptHandler(registrationStatusHandler));
app.all('/api/security-info', adaptHandler(securityInfoHandler));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Crypto 512 Server running on port ${PORT}`);
  console.log(`📱 Web app: http://localhost:${PORT}`);
  console.log(`🔌 API endpoints: http://localhost:${PORT}/api/*`);
  console.log('');
  console.log('🔧 Fixed Issues:');
  console.log('  ✅ Message reactions, edit, delete (HTTP method fixes)');
  console.log('  ✅ File downloads return actual files, not JSON');
  console.log('  ✅ Mobile-responsive file attachment interface');
  console.log('  ✅ Enhanced WebRTC voice/video calls with screen sharing');
  console.log('  ✅ Photo/video editing before sending');
  console.log('  ✅ Comprehensive settings panel with backup/restore');
  console.log('  ✅ Auto-download preferences and storage management');
  console.log('  ✅ Dark mode support and mobile optimization');
  console.log('');
  console.log('🎯 New Features:');
  console.log('  🔸 Image editing (brightness, contrast, filters, rotation)');
  console.log('  🔸 Audio message support');
  console.log('  🔸 File preview with thumbnails');
  console.log('  🔸 Settings: notifications, privacy, security, chat, backup, storage');
  console.log('  🔸 Data export/import functionality');
  console.log('  🔸 Cache management');
  console.log('  🔸 One-time view files with expiry');
  console.log('  🔸 Message reactions with multiple emojis');
  console.log('  🔸 Reply to messages');
  console.log('  🔸 Message highlighting when scrolling to replies');
});

module.exports = app;
