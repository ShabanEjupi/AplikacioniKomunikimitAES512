# 🗄️ Neon Database Setup for Crypto 512

## Quick Setup

### 1. Create Neon Database
1. Go to [Neon Console](https://console.neon.tech)
2. Click "Create Project"
3. Choose a name: `crypto-512-db`
4. Select region closest to your users
5. Copy the connection string

### 2. Add Environment Variable in Netlify
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string (starts with `postgresql://...`)

### 3. Deploy the Updated Code
```bash
# Push your changes to GitHub
git add .
git commit -m "Add Neon database support"
git push origin main
```

## What's New

### ✅ Database Functions
- **`registration-status.js`**: Auto-creates tables and default users
- **`login-enhanced.js`**: Database login with fallback
- **`users.js`**: Lists users from database
- **`db-init.js`**: Database initialization helper

### ✅ Auto-Setup
- Tables are created automatically on first run
- Default users are inserted automatically
- Fallback to in-memory storage if database fails

### ✅ Default Users (Auto-Created)
- `testuser` / `testpass123`
- `alice` / `alice123`
- `bob` / `bob123`
- `charlie` / `charlie123`

## Testing

### 1. Check Registration Status
```bash
curl https://cryptocall.netlify.app/api/registration-status
```

Should return:
```json
{
  "registrationEnabled": true,
  "hasDefaultUsers": true,
  "userCount": 4,
  "databaseStatus": "connected"
}
```

### 2. Test Login
```bash
curl -X POST https://cryptocall.netlify.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

## Troubleshooting

### If Database Connection Fails
- Functions will automatically fall back to in-memory storage
- Check Netlify function logs for database errors
- Verify `DATABASE_URL` environment variable is set

### Common Issues
1. **DATABASE_URL not set**: Add it in Netlify environment variables
2. **Connection timeout**: Neon database might be sleeping (first query wakes it up)
3. **Permission errors**: Check Neon database permissions

## Monitoring

### Netlify Function Logs
1. Go to Netlify dashboard
2. Navigate to **Functions** tab
3. Click on any function to see logs
4. Look for:
   - `✅ Database tables initialized`
   - `✅ Default users inserted`
   - `👥 Users in database: 4`

### Database Status
The `/api/registration-status` endpoint shows:
- `databaseStatus: "connected"` - Database working
- `databaseStatus: "error"` - Using fallback mode
- `userCount` - Number of users in database
