# 🔍 Debugging Guide for Crypto 512 Application

## Current Issue
- Getting 404 errors when calling `/api/registration-status` and other API endpoints
- Error message: "No users available and registration is disabled"

## What We've Implemented

### 1. Enhanced Logging
- **Client-side API logging**: Added detailed console logs in `client/src/api/index.ts`
- **Authentication logging**: Enhanced `client/src/auth/authentication.ts` with better error handling
- **Login component logging**: Added detailed error logging in `client/src/components/Login.tsx`

### 2. API Diagnostics Component
- **New component**: `client/src/components/ApiDiagnostics.tsx`
- **Features**: Tests all API endpoints and shows detailed results
- **Usage**: Automatically shows up in development mode or when there are errors

### 3. Configuration Check
- **Environment**: Using centralized config from `client/src/config/index.ts`
- **Production URL**: `/api` (uses Netlify redirects)
- **Development URL**: `http://localhost:3000/api`

### 4. Netlify Configuration
- **Redirects**: Properly configured in `netlify.toml`
- **Functions**: All API endpoints mapped to Netlify functions

## How to Debug

### Step 1: Check the Console
1. Open your deployed site at `https://cryptocall.netlify.app`
2. Open browser DevTools (F12) → Console tab
3. Look for:
   - `🔧 API Client initializing...` - Shows configuration
   - `📤 API Request:` - Shows outgoing requests
   - `❌ API Error:` - Shows errors with full details

### Step 2: Use API Diagnostics
1. The login page now includes an "API Diagnostics" section
2. Click "Run API Diagnostics" to test all endpoints
3. Review the results for specific errors

### Step 3: Check Network Tab
1. DevTools → Network tab
2. Look for requests to `/api/registration-status`
3. Check if they're being redirected to `/.netlify/functions/registration-status`

### Step 4: Check Netlify Function Logs
1. Go to your Netlify dashboard
2. Navigate to Functions tab
3. Check the logs for the `registration-status` function

## Expected Behavior

### Working Scenario
```
📤 API Request: GET /registration-status
📍 Full URL: /api/registration-status
✅ API Response: GET /registration-status 200
📊 Response data: {
  registrationEnabled: true,
  hasDefaultUsers: true,
  availableUsers: [...]
}
```

### Error Scenario
```
❌ API Error: GET /registration-status
📍 Full URL: /api/registration-status
Status: 404
Code: ERR_NETWORK
Message: Request failed with status code 404
```

## Common Issues & Solutions

### Issue 1: 404 Errors
**Cause**: API calls not reaching Netlify functions
**Solution**: Check `netlify.toml` redirects and function deployment

### Issue 2: CORS Errors
**Cause**: Missing CORS headers
**Solution**: All functions include proper CORS headers

### Issue 3: Environment Mismatch
**Cause**: Wrong API base URL
**Solution**: Check that production builds use `/api` and development uses `localhost:3000/api`

## Test Commands

```bash
# Build and test locally
cd client
npm run build

# Test a specific endpoint directly
curl https://cryptocall.netlify.app/api/registration-status

# Check function deployment
curl https://cryptocall.netlify.app/.netlify/functions/registration-status
```

## Next Steps if Still Failing
1. Check Netlify deployment logs
2. Verify all functions are deployed
3. Test direct function URLs (`.netlify/functions/...`)
4. Check environment variables in Netlify dashboard
