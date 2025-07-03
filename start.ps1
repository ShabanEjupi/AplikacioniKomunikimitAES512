#!/usr/bin/env pwsh
Write-Host "Starting Crypto 512 - Secure Communication System" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm run install:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "Creating required directories..." -ForegroundColor Yellow
if (!(Test-Path "server\uploads")) { New-Item -ItemType Directory -Path "server\uploads" -Force }
if (!(Test-Path "server\data")) { New-Item -ItemType Directory -Path "server\data" -Force }

Write-Host ""
Write-Host "Starting the application..." -ForegroundColor Green
Write-Host "Backend Server: http://localhost:3000" -ForegroundColor White
Write-Host "Frontend Client: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Features available:" -ForegroundColor Cyan
Write-Host "   Text messaging with encryption" -ForegroundColor Green
Write-Host "   Photo and video sharing" -ForegroundColor Green
Write-Host "   Voice and video calls" -ForegroundColor Green
Write-Host "   Group chats" -ForegroundColor Green
Write-Host "   Emoji reactions" -ForegroundColor Green
Write-Host "   File uploads" -ForegroundColor Green
Write-Host ""

# Start the application
npm run start:demo