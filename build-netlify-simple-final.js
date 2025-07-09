#!/usr/bin/env node

// Ultra-simple Netlify build script
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Building Crypto 512 Client...');

const clientDir = path.join(__dirname, 'client');

try {
  // Set environment variables
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_ENV = 'production';
  process.env.CI = 'true';
  
  console.log('📂 Changing to client directory...');
  process.chdir(clientDir);
  
  console.log('📦 Installing dependencies...');
  execSync('npm ci --legacy-peer-deps', { stdio: 'inherit' });
  
  console.log('🏗️ Building...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
