# PowerShell script to start both servers for development
Write-Host "🚀 Starting Crypto 512 Secure Communication App..." -ForegroundColor Green
Write-Host ""

Write-Host "📡 Starting backend server on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node simple-server.js" -WorkingDirectory $PWD

Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "🌐 Starting React development server..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WorkingDirectory $PWD

Write-Host ""
Write-Host "✅ Both servers are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend will be available at: http://localhost:3000" -ForegroundColor Blue
Write-Host "🔧 Backend is running at: http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
Read-Host
