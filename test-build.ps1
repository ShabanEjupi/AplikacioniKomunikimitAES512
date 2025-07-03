#!/usr/bin/env pwsh

Write-Host "Testing Netlify Build Process" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Installing dependencies..." -ForegroundColor Yellow
npm ci --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependencies installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "2. Installing workspace dependencies..." -ForegroundColor Yellow
npm run install:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Workspace dependencies installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "3. Building client..." -ForegroundColor Yellow
cd client
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client build failed" -ForegroundColor Red
    exit 1
}
cd ..

Write-Host "✅ Build test successful!" -ForegroundColor Green
Write-Host "📦 Build output is in client/build/" -ForegroundColor White
