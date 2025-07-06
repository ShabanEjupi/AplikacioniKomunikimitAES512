#!/usr/bin/env node

// Netlify build script with TypeScript conflict resolution
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Crypto 512 Client for Netlify...');

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
    // Set environment variables for client build
    process.env.SKIP_PREFLIGHT_CHECK = 'true';
    process.env.GENERATE_SOURCEMAP = 'false';
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';
    process.env.NODE_ENV = 'production';

    // Step 1: Navigate to client directory and clean install
    console.log('\n📦 Preparing client build...');
    process.chdir('client');
    
    // Remove lock files that might cause conflicts
    const lockFiles = ['package-lock.json', 'yarn.lock', 'node_modules'];
    lockFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`🧹 Removing ${file}...`);
        if (file === 'node_modules') {
          fs.rmSync(file, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file);
        }
      }
    });
    
    // Install dependencies with legacy peer deps to resolve TypeScript conflicts
    console.log('\n📦 Installing client dependencies...');
    if (!runCommand('npm install --legacy-peer-deps --no-optional')) {
      throw new Error('Failed to install client dependencies');
    }

    // Step 2: Build client
    console.log('\n🎯 Building client application...');
    if (!runCommand('npm run build')) {
      throw new Error('Failed to build client');
    }
    
    console.log('\n✅ Build completed successfully!');
    console.log('📁 Build output is in client/build directory');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
