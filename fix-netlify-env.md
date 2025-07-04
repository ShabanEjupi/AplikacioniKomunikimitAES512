# 🔧 Fix Netlify Environment Variables

## Critical Issues to Fix:

### 1. Fix NODE_ENV Setting
**Current (WRONG):** All contexts = `production`
**Should be:**
- Production: `production`
- Deploy Previews: `development` 
- Branch deploys: `development`
- Preview Server: `development`
- Local development: `development`

### 2. Add DATABASE_URL Environment Variable
Add a new environment variable:
- **Name:** `DATABASE_URL`
- **Value:** Use the same value as `NETLIFY_DATABASE_URL`
- **Scope:** All scopes, same value in all deploy contexts

```
postgresql://neondb_owner:npg_beWEv6wdBYR1@ep-steep-glitter-aezec7b3-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Steps to Fix in Netlify Dashboard:

1. Go to: Site Settings → Environment Variables
2. Edit NODE_ENV:
   - Keep Production as `production`
   - Change all other contexts to `development`
3. Add new variable DATABASE_URL with the database connection string
4. Redeploy your site

## Why These Fixes Are Important:

- **NODE_ENV**: Controls which API endpoints your app connects to
- **DATABASE_URL**: Required by your database functions to connect to Neon
