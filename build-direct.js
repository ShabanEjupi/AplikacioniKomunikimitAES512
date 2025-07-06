#!/usr/bin/env node

// Direct client build - bypasses all workspace issues
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Building Crypto 512 Client - Direct Build...');

function runCommand(command, options = {}) {
  try {
    console.log(`🔨 Running: ${command}`);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Set environment variables
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.NODE_ENV = 'production';

// Change to client directory
process.chdir('client');

// Clean lockfiles
if (fs.existsSync('package-lock.json')) {
  fs.unlinkSync('package-lock.json');
}

console.log('📦 Installing dependencies...');
if (!runCommand('npm install --legacy-peer-deps')) {
  process.exit(1);
}

console.log('🎯 Building application...');
if (!runCommand('npm run build')) {
  process.exit(1);
}

console.log('✅ Build completed successfully!');
