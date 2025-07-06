#!/usr/bin/env node

// Simple client-only build script for Netlify deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Crypto 512 Client...');

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
    process.env.SKIP_PREFLIGHT_CHECK = 'true';
    process.env.GENERATE_SOURCEMAP = 'false';
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';

    // Go to client directory
    process.chdir('client');

    // Clean install to avoid version conflicts
    console.log('\n🧹 Cleaning existing node_modules...');
    const fs = require('fs');
    const path = require('path');
    
    if (fs.existsSync('node_modules')) {
      fs.rmSync('node_modules', { recursive: true, force: true });
    }
    
    if (fs.existsSync('package-lock.json')) {
      fs.unlinkSync('package-lock.json');
    }

    // Install client dependencies
    console.log('\n📦 Installing client dependencies...');
    if (!runCommand('npm install --legacy-peer-deps')) {
      throw new Error('Failed to install client dependencies');
    }

    // Build client
    console.log('\n🎯 Building client application...');
    if (!runCommand('npm run build')) {
      throw new Error('Failed to build client');
    }

    console.log('\n✅ Client build completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
