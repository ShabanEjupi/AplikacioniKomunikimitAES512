# Copilot Instructions for Crypto 512 Secure Communication App

## Architecture Overview

This is a **serverless chat application** with React frontend and Netlify Functions backend using **in-memory storage** (no database). The app follows a simple client-server pattern where all data resets on function cold starts.

### Key Components
- **Frontend**: React 18 + TypeScript in `/client/` using CRACO for build customization
- **Backend**: Netlify Functions in `/netlify/functions/` with shared in-memory state
- **Authentication**: Simple SHA-256 hashed passwords with Base64 tokens
- **Communication**: REST API with CORS enabled, no WebSockets (uses polling every 3s)

## Critical Patterns

### In-Memory Storage Synchronization
All functions share the same in-memory stores but must be kept in sync:
```javascript
// Pattern used in login.js, register.js, users.js
let users = new Map();
// Pattern used in messages.js, conversation.js  
let messages = [];
```
**Important**: When adding users/messages, update ALL relevant function files to maintain consistency.

### Authentication Flow
- Login returns Base64 encoded `userId:username` token
- Token passed as `Authorization: Bearer <token>` header
- Decode with: `Buffer.from(token, 'base64').toString().split(':')`
- Current user stored in localStorage as JSON

### API Endpoint Patterns
Functions follow consistent structure:
1. CORS headers (copy from existing functions)
2. OPTIONS method handling for preflight
3. Method validation (GET/POST only typically)
4. Error handling with proper status codes
5. JSON response format

### Environment Configuration
- `client/src/config/index.ts` handles dev/prod API routing
- Development: `http://localhost:3001/api` (requires Netlify dev)
- Production: `/api` (redirected to `/.netlify/functions/`)
- Client auto-detects localhost for environment switching

## Development Workflows

### Local Development Setup
```bash
# Install client dependencies (required flag)
cd client && npm install --legacy-peer-deps

# Start frontend only
npm start

# Full stack with functions
netlify dev  # Serves frontend + functions on :8888
```

### Building and Deployment
```bash
# Build client (automated in root package.json)
npm run build

# Manual deploy
netlify deploy --prod --dir=client/build
```

### Testing Users
Always available for testing:
- `testuser` / `testpass123` (userId: 1001)
- `alice` / `alice123` (userId: 1002)

## Project-Specific Conventions

### File Organization
- `/client/src/api/index.ts` - Central API functions with TypeScript interfaces
- `/client/src/auth/` - Alternative auth service (duplicate of api functions)
- `/netlify/functions/` - Each endpoint is a separate file
- Functions share naming: `messages.js`, `conversation.js` (related but different endpoints)

### Message Handling
- Global messages in `messages.js` (broadcast/history)
- Private conversations in `conversation.js` (filtered by participants)
- Messages include: `id`, `senderId`, `recipientId`, `content`, `timestamp`
- Message IDs start at 1000, auto-increment

### TypeScript Integration
- Client uses strict TypeScript with interfaces in API layer
- Functions are vanilla JavaScript (no TypeScript compilation)
- Type definitions centralized in `client/src/api/index.ts`

### CORS and Security
Every function needs these exact headers:
```javascript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};
```

## Integration Points

### Client-Backend Communication
- Client automatically retries failed requests
- Environment-aware API base URL switching
- localStorage used for user session persistence
- Polling-based message updates (no real-time WebSocket)

### Netlify-Specific
- Functions auto-deployed from `/netlify/functions/`
- No `netlify.toml` configuration needed (uses defaults)
- Cold start resets all in-memory data
- CRACO config allows imports outside src/ directory

When adding new features, maintain the in-memory synchronization pattern and follow the established authentication/CORS patterns.
