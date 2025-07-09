#!/usr/bin/env node

// Absolutely minimal Netlify build script - completely avoids workspace system
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Crypto 512 - Minimal Build for Netlify...');

function runCommand(command, options = {}) {
  try {
    console.log(`\n🔨 ${command}`);
    return execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf-8',
      ...options
    });
  } catch (error) {
    console.error(`❌ Failed: ${command}`);
    console.error('Error:', error.message);
    throw error;
  }
}

try {
  // Set essential environment variables
  process.env.NODE_ENV = 'production';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  
  const clientDir = path.join(__dirname, 'client');
  process.chdir(clientDir);
  
  console.log('📂 Working in client directory:', clientDir);
  
  // Remove any existing npm workspace configuration
  const npmrcPath = path.join(clientDir, '.npmrc');
  if (fs.existsSync(npmrcPath)) {
    console.log('🗑️ Temporarily removing .npmrc...');
    fs.unlinkSync(npmrcPath);
  }
  
  // Clean install without workspace dependencies
  console.log('📦 Installing dependencies...');
  runCommand('npm install --legacy-peer-deps --ignore-workspace-root-check');
  
  // Build the client
  console.log('🏗️ Building client...');
  runCommand('npm run build');
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
