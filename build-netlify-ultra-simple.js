#!/usr/bin/env node

// Ultra-simple Netlify build script - avoids ALL workspace issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Crypto 512 Client for Netlify (Ultra Simple)...');

function runCommand(command, options = {}) {
  try {
    console.log(`\n🔨 Running: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf-8',
      ...options
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error('Error:', error.message);
    throw error;
  }
}

try {
  // Set environment variables to prevent conflicts
  process.env.NODE_ENV = 'production';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  
  // Clear any npm cache issues
  console.log('🧹 Clearing npm cache...');
  runCommand('npm cache clean --force');
  
  // Navigate to client directory and build directly
  console.log('📂 Navigating to client directory...');
  const clientDir = path.join(__dirname, 'client');
  
  // Remove any problematic files
  const packageLockPath = path.join(clientDir, 'package-lock.json');
  const nodeModulesPath = path.join(clientDir, 'node_modules');
  
  if (fs.existsSync(packageLockPath)) {
    console.log('🗑️ Removing package-lock.json...');
    fs.unlinkSync(packageLockPath);
  }
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('🗑️ Removing node_modules...');
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }
  
  // Install client dependencies with clean slate
  console.log('📦 Installing client dependencies...');
  runCommand('npm install --legacy-peer-deps --no-package-lock', { cwd: clientDir });
  
  // Build the client
  console.log('🏗️ Building client...');
  runCommand('npm run build', { cwd: clientDir });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
