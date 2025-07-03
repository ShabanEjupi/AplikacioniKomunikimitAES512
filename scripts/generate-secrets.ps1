#!/usr/bin/env pwsh
Write-Host "🔐 Generating Secure Environment Secrets" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

# Generate secure random secrets
$jwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
$sessionSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)

Write-Host "✅ Generated secure secrets:" -ForegroundColor Green
Write-Host ""
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
Write-Host "SESSION_SECRET=$sessionSecret" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔒 IMPORTANT SECURITY NOTES:" -ForegroundColor Red
Write-Host "• Replace the secrets in your .env file with these new values" -ForegroundColor White
Write-Host "• NEVER commit these secrets to version control" -ForegroundColor White
Write-Host "• Generate NEW secrets for each environment (dev, staging, production)" -ForegroundColor White
Write-Host "• Keep secrets secure and rotate them regularly" -ForegroundColor White
Write-Host ""

# Optionally update .env file
$updateEnv = Read-Host "Do you want to update your .env file automatically? (y/N)"
if ($updateEnv -eq "y" -or $updateEnv -eq "Y") {
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" -Raw
        $envContent = $envContent -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret"
        $envContent = $envContent -replace 'SESSION_SECRET=.*', "SESSION_SECRET=$sessionSecret"
        Set-Content ".env" $envContent
        Write-Host "✅ Updated .env file with new secrets" -ForegroundColor Green
    } else {
        Write-Host "❌ .env file not found. Please create one from .env.example" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 Your application is now more secure!" -ForegroundColor Green
