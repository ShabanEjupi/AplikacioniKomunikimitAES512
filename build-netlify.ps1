#!/usr/bin/env pwsh
Write-Host "🔨 Building Crypto 512 for Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

# Set error handling
$ErrorActionPreference = "Stop"

try {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm ci --legacy-peer-deps
    
    Write-Host "🔧 Installing workspace dependencies..." -ForegroundColor Yellow
    npm run install:all
    
    Write-Host "🏗️ Building shared package..." -ForegroundColor Yellow
    cd shared
    npm run build
    cd ..
    
    Write-Host "🎯 Building client..." -ForegroundColor Yellow
    cd client
    npm ci --legacy-peer-deps
    npm run build
    cd ..
    
    Write-Host "⚡ Installing function dependencies..." -ForegroundColor Yellow
    cd netlify/functions
    npm install
    cd ../..
    
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}
