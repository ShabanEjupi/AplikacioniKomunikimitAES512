#!/usr/bin/env node

// Ultra-simple build script for Netlify - CLIENT ONLY
const { execSync } = require('child_process');

console.log('🚀 Building Client for Netlify...');

function runCommand(command) {
  try {
    console.log(`\n🔨 Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    return false;
  }
}

// Environment variables for client build
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Go to client directory
process.chdir('client');

// Install and build
console.log('\n📦 Installing dependencies...');
if (!runCommand('npm ci --legacy-peer-deps')) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

console.log('\n🎯 Building application...');
if (!runCommand('npm run build')) {
  console.error('❌ Build failed');
  process.exit(1);
}

console.log('\n✅ Build completed successfully!');
