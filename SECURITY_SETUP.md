# 🔐 Security Guide - Crypto 512 Secure Communications

## 🚨 Critical Security Fixes Applied

### Issues Identified and Fixed:

1. **Hard-coded Secrets Exposure** ❌ → ✅ **FIXED**
   - Removed hard-coded JWT and session secrets from `constants.ts`
   - Moved secrets to environment variables
   - Added secure random key generation fallback

2. **User Authentication Issues** ❌ → ✅ **FIXED**
   - Enhanced default user initialization
   - Added registration status checking
   - Improved login/registration flow with better error handling

3. **Missing Registration Features** ❌ → ✅ **FIXED**
   - Added registration toggle functionality
   - Registration can be enabled/disabled via environment variables
   - Added registration status API endpoint

## 🛠️ Setup Instructions

### 1. Generate Secure Secrets

**NEVER use the default secrets in production!**

#### Option A: Use the provided script
```powershell
.\scripts\generate-secrets.ps1
```

#### Option B: Generate manually
```bash
# Generate JWT secret (64 characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret (64 characters)
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Update Environment Variables

Copy the generated secrets to your `.env` file:

```bash
# Copy the template
cp .env.example .env

# Edit .env with your generated secrets
JWT_SECRET=your_generated_jwt_secret_here
SESSION_SECRET=your_generated_session_secret_here
```

### 3. User Management Configuration

Configure user settings in `.env`:

```bash
# Enable/disable user registration
ENABLE_REGISTRATION=true

# Enable/disable default test users
DEFAULT_USERS_ENABLED=true
```

## 👥 Default Users

When `DEFAULT_USERS_ENABLED=true`, the following test users are available:

| Username | Password | Description |
|----------|----------|-------------|
| `testuser` | `testpass123` | Primary test user |
| `alice` | `alice123` | Demo user Alice |
| `bob` | `bob123` | Demo user Bob |
| `charlie` | `charlie123` | Demo user Charlie |

## 🔧 Testing & Debugging

### Test Login Functionality
```powershell
.\scripts\test-login.ps1
```

This script will:
- ✅ Check server connectivity
- ✅ Test registration status
- ✅ Test login with default users
- ✅ Test user registration
- ✅ Provide debugging information

### Manual API Testing

#### Check Registration Status
```bash
curl http://localhost:3001/api/registration-status
```

#### Test Login
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

#### Test Registration (if enabled)
```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"newpass123"}'
```

## 🛡️ Security Best Practices

### Production Deployment

1. **Environment Variables**
   - Generate NEW secrets for production
   - Use environment variable injection (not .env files)
   - Rotate secrets regularly

2. **User Management**
   - Disable default test users in production: `DEFAULT_USERS_ENABLED=false`
   - Consider disabling registration: `ENABLE_REGISTRATION=false`
   - Implement proper user verification for registration

3. **Additional Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Add proper session management
   - Use secure password policies

### Git Security

The following files should NEVER be committed:
- `.env` (contains secrets)
- Any files with production secrets
- SSL certificates

Already configured in `.gitignore`:
```gitignore
.env
.env.local
.env.production
/server/certs/*.pem
/server/certs/*.key
```

## 🐛 Troubleshooting

### Login Issues

1. **"User not found" error**
   - Check if default users are enabled: `DEFAULT_USERS_ENABLED=true`
   - Verify server is running and initialized properly
   - Check server logs for user initialization messages

2. **"Registration disabled" error**
   - Set `ENABLE_REGISTRATION=true` in `.env`
   - Restart the server

3. **Token/JWT errors**
   - Ensure JWT_SECRET is set in `.env`
   - Check server logs for authentication errors
   - Verify token format and expiration

### Server Issues

1. **Server won't start**
   - Check if all dependencies are installed: `npm run install:all`
   - Verify .env file exists and has required variables
   - Check port 3001 is available

2. **CORS errors**
   - Verify client URL is in server CORS configuration
   - Check if both client and server are running

## 📊 Security Features

### Current Implementation

- ✅ AES-512 encryption for message content
- ✅ ASH-512 hash algorithm for integrity verification
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ Session management
- ✅ TLS/HTTPS support
- ✅ Environment-based secret management

### Future Enhancements

- 🔄 Multi-factor authentication (MFA)
- 🔄 OAuth integration
- 🔄 Advanced rate limiting
- 🔄 Audit logging
- 🔄 Key rotation mechanisms

## 🚀 Quick Start

```powershell
# 1. Generate secrets
.\scripts\generate-secrets.ps1

# 2. Install dependencies
npm run install:all

# 3. Start application
.\start.ps1

# 4. Test login functionality
.\scripts\test-login.ps1
```

## 📞 Support

If you encounter issues:

1. Check this security guide
2. Run the test login script for debugging
3. Check server logs for detailed error messages
4. Verify environment configuration
5. Ensure all dependencies are installed

---

**Remember**: Security is an ongoing process. Regularly update dependencies, rotate secrets, and monitor for vulnerabilities.
