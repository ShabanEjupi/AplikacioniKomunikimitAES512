# Test Database Connection and Initialize
# This script tests the database connection and initializes the database schema

Write-Host "Testing Database Connection and Initialization" -ForegroundColor Green
Write-Host ""

# Test database initialization
Write-Host "Initializing database..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8888/.netlify/functions/db-init" -Method POST -ContentType "application/json"
    Write-Host "Database initialization successful:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "Database initialization failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing user registration..." -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser"
        password = "testpass123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8888/.netlify/functions/register-db" -Method POST -Body $body -ContentType "application/json"
    Write-Host "User registration successful:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "User registration failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing user login..." -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser"
        password = "testpass123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8888/.netlify/functions/login-db" -Method POST -Body $body -ContentType "application/json"
    Write-Host "User login successful:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    
    # Store token for next test
    $token = $response.token
    Write-Host "Token stored for users test" -ForegroundColor Cyan
} catch {
    Write-Host "User login failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $token = $null
}

Write-Host ""
Write-Host "Testing users list..." -ForegroundColor Yellow
try {
    $headers = @{}
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:8888/.netlify/functions/users" -Method GET -Headers $headers
    Write-Host "Users list successful:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "Users list failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Database tests completed!" -ForegroundColor Green
