@echo off
echo 🚀 Starting Crypto 512 Secure Communication App...
echo.

echo 📡 Starting backend server on port 3001...
start "Backend Server" cmd /k "node simple-server.js"

echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo 🌐 Starting React development server...
start "React Dev Server" cmd /k "npm start"

echo.
echo ✅ Both servers are starting up!
echo.
echo 📱 Frontend will be available at: http://localhost:3000
echo 🔧 Backend is running at: http://localhost:3001
echo.
echo Press any key to exit...
pause >nul
