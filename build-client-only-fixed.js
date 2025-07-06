#!/usr/bin/env node

// Simple client-only build script for Netlify deployment with TypeScript fix
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Crypto 512 Client with TypeScript Fix...');

function runCommand(command, options = {}) {
  try {
    console.log(`\n🔨 Running: ${command}`);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function main() {
  try {
    // Set environment variables for better compatibility
    process.env.NODE_ENV = 'production';
    process.env.SKIP_PREFLIGHT_CHECK = 'true';
    process.env.GENERATE_SOURCEMAP = 'false';
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';
    process.env.NPM_CONFIG_LEGACY_PEER_DEPS = 'true';
    process.env.NPM_CONFIG_FORCE = 'true';

    console.log('\n📦 Installing root dependencies...');
    
    // Install root dependencies with force to resolve conflicts
    if (!runCommand('npm install --legacy-peer-deps --force')) {
      console.log('Warning: Root dependencies installation had issues, continuing...');
    }

    console.log('\n🔧 Building client directly...');
    process.chdir('client');
    
    // Force install compatible TypeScript version
    console.log('\n🔧 Installing TypeScript 4.9.5...');
    if (!runCommand('npm install typescript@4.9.5 --save-dev --legacy-peer-deps --force')) {
      console.log('Warning: Could not install specific TypeScript version');
    }
    
    // Install client dependencies
    console.log('\n🔧 Installing client dependencies...');
    if (!runCommand('npm install --legacy-peer-deps --force')) {
      throw new Error('Failed to install client dependencies');
    }

    console.log('\n🎯 Building client application...');
    if (!runCommand('npm run build')) {
      throw new Error('Failed to build client');
    }
    
    process.chdir('..');

    console.log('\n✅ Build completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
