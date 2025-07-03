#!/usr/bin/env pwsh

Write-Host "Preparing Crypto 512 for Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

# Check if git is initialized
if (!(Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    
    # Create .gitignore if it doesn't exist
    if (!(Test-Path ".gitignore")) {
        Write-Host "Creating .gitignore file..." -ForegroundColor Yellow
        @"
# Dependencies
node_modules/
npm-debug.log*

# Production builds
/client/build
/server/dist

# Environment variables
.env
.env.local

# SSL Certificates
/server/certs/*.pem

# Uploads
/server/uploads/*
!/server/uploads/.gitkeep

# IDE
.vscode/
.idea/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
    }
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm run install:all

# Build client for production
Write-Host "Building client for production..." -ForegroundColor Yellow
cd client
npm run build
cd ..

# Stage all files
Write-Host "Staging files for commit..." -ForegroundColor Yellow
git add .

# Commit changes
$commitMessage = "Prepare for deployment: Secure communication app with ASH-512"
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

Write-Host ""
Write-Host "Project prepared for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a GitHub repository" -ForegroundColor White
Write-Host "2. Push to GitHub:" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git remote add origin https://github.com/yourusername/your-repo.git" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy frontend to Netlify (connect GitHub repo)" -ForegroundColor White
Write-Host "4. Deploy backend to Railway/Heroku" -ForegroundColor White
Write-Host "5. Update config/index.ts with production URLs" -ForegroundColor White
Write-Host ""
Write-Host "Then test with your mobile devices!" -ForegroundColor Green
