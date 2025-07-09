#!/usr/bin/env node

// Netlify build script with dependency fix
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Building Crypto 512 Client with Dependency Fix...');

const clientDir = path.join(__dirname, 'client');

function runCommand(command, options = {}) {
  try {
    console.log(`\n🔨 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd: options.cwd || clientDir,
      env: { ...process.env, ...options.env }
    });
  } catch (error) {
    console.error(`❌ Failed: ${command}`);
    throw error;
  }
}

try {
  // Set environment variables
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_ENV = 'production';
  process.env.CI = 'true';
  
  console.log('📂 Working in client directory...');
  
  // Fix the dependency issue by installing compatible versions
  console.log('🔧 Fixing dependency conflicts...');
  runCommand('npm install ajv@^8.12.0 ajv-keywords@^5.1.0 --legacy-peer-deps');
  
  console.log('🏗️ Building...');
  runCommand('npm run build');
  
  console.log('✅ Build completed!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
