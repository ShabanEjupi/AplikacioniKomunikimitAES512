#!/usr/bin/env pwsh
Write-Host "🔍 Login Testing and Debugging Tool" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Yellow
Write-Host ""

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = @{},
        [string]$ContentType = "application/json"
    )
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -ContentType $ContentType
        } else {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $jsonBody -ContentType $ContentType
        }
        return @{ Success = $true; Data = $response }
    } catch {
        return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $_.Exception.Response.StatusCode }
    }
}

# Check if server is running
Write-Host "🔌 Testing server connection..." -ForegroundColor Yellow
$serverTest = Test-ApiEndpoint -Url "http://localhost:3001/api/registration-status"

if ($serverTest.Success) {
    Write-Host "✅ Server is running!" -ForegroundColor Green
    Write-Host "📊 Registration Status:" -ForegroundColor Cyan
    Write-Host "  • Registration Enabled: $($serverTest.Data.registrationEnabled)" -ForegroundColor White
    Write-Host "  • Has Default Users: $($serverTest.Data.hasDefaultUsers)" -ForegroundColor White
    
    if ($serverTest.Data.availableUsers) {
        Write-Host "  • Available Users: $($serverTest.Data.availableUsers -join ', ')" -ForegroundColor White
    }
    Write-Host ""
} else {
    Write-Host "❌ Server not responding!" -ForegroundColor Red
    Write-Host "   Error: $($serverTest.Error)" -ForegroundColor White
    Write-Host "   Please start the server first with: npm run start:server" -ForegroundColor Yellow
    exit 1
}

# Test default user login
Write-Host "🔐 Testing default user login..." -ForegroundColor Yellow

$testUsers = @(
    @{ username = "testuser"; password = "testpass123" },
    @{ username = "alice"; password = "alice123" },
    @{ username = "bob"; password = "bob123" },
    @{ username = "charlie"; password = "charlie123" }
)

foreach ($user in $testUsers) {
    Write-Host "👤 Testing login for: $($user.username)" -ForegroundColor Cyan
    
    $loginResult = Test-ApiEndpoint -Url "http://localhost:3001/api/login" -Method "POST" -Body $user
    
    if ($loginResult.Success) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host "   Token received: $($loginResult.Data.token.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ Login failed!" -ForegroundColor Red
        Write-Host "   Error: $($loginResult.Error)" -ForegroundColor White
        if ($loginResult.StatusCode) {
            Write-Host "   Status Code: $($loginResult.StatusCode)" -ForegroundColor White
        }
    }
    Write-Host ""
}

# Test registration
Write-Host "📝 Testing user registration..." -ForegroundColor Yellow
$newUser = @{ 
    username = "testuser_$(Get-Random -Maximum 9999)"; 
    password = "securepass123" 
}

Write-Host "👤 Registering new user: $($newUser.username)" -ForegroundColor Cyan

$registerResult = Test-ApiEndpoint -Url "http://localhost:3001/api/register" -Method "POST" -Body $newUser

if ($registerResult.Success) {
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "   User ID: $($registerResult.Data.user.id)" -ForegroundColor Gray
    
    # Test login with new user
    Write-Host "🔐 Testing login with newly registered user..." -ForegroundColor Yellow
    $newLoginResult = Test-ApiEndpoint -Url "http://localhost:3001/api/login" -Method "POST" -Body $newUser
    
    if ($newLoginResult.Success) {
        Write-Host "✅ New user login successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ New user login failed!" -ForegroundColor Red
        Write-Host "   Error: $($newLoginResult.Error)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Registration failed!" -ForegroundColor Red
    Write-Host "   Error: $($registerResult.Error)" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Debugging Tips:" -ForegroundColor Yellow
Write-Host "• Check server logs for detailed error messages" -ForegroundColor White
Write-Host "• Verify .env file has correct secrets" -ForegroundColor White
Write-Host "• Ensure default users are initialized properly" -ForegroundColor White
Write-Host "• Check that authentication middleware is working" -ForegroundColor White
