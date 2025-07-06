#!/usr/bin/env node

// Comprehensive build script for Netlify deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Crypto 512 build process...');

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
    // Step 1: Install root dependencies
    console.log('\n📦 Installing root dependencies...');
    if (!runCommand('npm install --legacy-peer-deps')) {
      throw new Error('Failed to install root dependencies');
    }

    // Step 2: Install workspace dependencies
    console.log('\n🔧 Installing workspace dependencies...');
    if (!runCommand('npm install --legacy-peer-deps --workspaces')) {
      throw new Error('Failed to install workspace dependencies');
    }

    // Step 3: Skip shared package build for now - not needed for client
    console.log('\n⏭️  Skipping shared package build (not needed for client)...');

    // Step 4: Build client
    console.log('\n🎯 Building client application...');
    process.chdir('client');
    
    if (!fs.existsSync('node_modules')) {
      runCommand('npm install');
    }
    
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
