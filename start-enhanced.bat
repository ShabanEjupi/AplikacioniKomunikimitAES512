@echo off
echo ================================================
echo   🔐 Crypto 512 Enhanced Secure Communications
echo ================================================
echo.
echo 🚀 Starting enhanced server with all fixes...
echo.
echo ✅ Fixed Issues:
echo   - Message reactions, edit, delete work properly
echo   - File downloads return actual files, not JSON
echo   - Mobile file attachment interface fixed
echo   - Voice/video calls with WebRTC implementation
echo   - Photo/video editing before sending
echo.
echo 🎯 New Features:
echo   - Comprehensive Settings panel
echo   - Data backup and restore
echo   - Image editing tools
echo   - Audio message support
echo   - Dark mode support
echo   - Mobile-optimized interface
echo.
echo ⏳ Please wait...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ✅ Starting enhanced server...
echo.
node enhanced-server.js

pause
