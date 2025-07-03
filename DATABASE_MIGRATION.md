# 🗄️ Database Migration Guide - Crypto 512 to Netlify DB

## Prerequisites
1. Netlify account
2. Netlify CLI installed
3. Project deployed to Netlify

## Step-by-Step Setup

### 1. Initialize Netlify DB
```bash
# In your project root
npx netlify db init
```

### 2. Run Database Schema
```bash
# Apply the schema to your database
npx netlify db create --sql database/schema.sql
```

### 3. Set Environment Variables
The database URL will be automatically added to your Netlify environment as `DATABASE_URL`.

### 4. Deploy Updated Functions
```bash
# Deploy the new database-enabled functions
npx netlify deploy --prod
```

## Benefits of This Migration

### 🔒 Enhanced Security
- **Persistent user accounts** (no more in-memory storage)
- **Encrypted message storage** with AES-512
- **Integrity verification** with ASH-512 hashes
- **Security audit trail** for all actions
- **Session management** with database tokens

### 📊 Better Data Management
- **ACID transactions** ensure data consistency
- **Indexes** for fast query performance
- **Foreign keys** maintain data relationships
- **Backup and recovery** through Neon

### 🚀 Scalability
- **Concurrent users** without conflicts
- **Connection pooling** for performance
- **Horizontal scaling** capabilities
- **Real-time features** with database triggers

## Database Schema Overview

### Tables Created:
1. **users** - User accounts with ASH-512 hashed passwords
2. **messages** - AES-512 encrypted messages with integrity hashes
3. **groups** - Group chat functionality
4. **group_members** - Group membership tracking
5. **file_uploads** - File attachment metadata
6. **security_audit** - Complete audit trail
7. **sessions** - Secure session management

### Security Features:
- All passwords hashed with ASH-512
- All messages encrypted with AES-512
- Integrity verification for all data
- Complete audit logging
- Session token validation

## Testing the Database

### Test Users (Pre-loaded):
- **testuser** / testpass123
- **alice** / alice123
- **bob** / bob123
- **charlie** / charlie123

### API Endpoints (Database-Powered):
- `POST /api/register` - Create new user account
- `POST /api/login` - Authenticate and get session token
- `GET /api/messages` - Retrieve user's messages
- `POST /api/messages` - Send encrypted message

## Migration Checklist

- [ ] Run `npx netlify db init`
- [ ] Apply database schema
- [ ] Update Netlify functions to use database versions
- [ ] Test login/registration with database
- [ ] Test message sending/receiving
- [ ] Verify security audit logging
- [ ] Update client-side API calls if needed

## Rollback Plan

If you need to rollback:
1. Change netlify.toml redirects back to original functions
2. Deploy with `npx netlify deploy --prod`
3. Database will remain available for future migration

## Next Steps

1. **Advanced Features**: Add real-time notifications using database triggers
2. **File Storage**: Integrate with Netlify Blob for encrypted file storage
3. **Analytics**: Use the audit table for usage analytics
4. **Backup**: Set up automated database backups

This migration transforms your app from a demo to a production-ready secure communication system! 🎉
