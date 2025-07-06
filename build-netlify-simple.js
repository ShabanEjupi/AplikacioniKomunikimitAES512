#!/usr/bin/env node

// Ultra-simple Netlify build script - client only
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Building Crypto 512 Client for Netlify...');

function runCommand(command, options = {}) {
  try {
    console.log(`\n🔨 Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env }
    });
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
    const buildEnv = {
      NODE_ENV: 'production',
      SKIP_PREFLIGHT_CHECK: 'true',
      GENERATE_SOURCEMAP: 'false',
      NODE_OPTIONS: '--max-old-space-size=4096',
      CI: 'false'
    };

    // Navigate to client directory
    const clientDir = 'client';
    console.log(`\n📁 Changing to ${clientDir} directory...`);
    
    // Clean install in client directory
    console.log('\n🧹 Cleaning client dependencies...');
    const lockFiles = ['package-lock.json', 'yarn.lock'];
    lockFiles.forEach(file => {
      const filePath = `${clientDir}/${file}`;
      if (fs.existsSync(filePath)) {
        console.log(`🗑️  Removing ${filePath}...`);
        fs.unlinkSync(filePath);
      }
    });
    
    // Install client dependencies
    console.log('\n📦 Installing client dependencies...');
    if (!runCommand('npm install --legacy-peer-deps --no-optional --prefer-offline', { 
      cwd: clientDir, 
      env: buildEnv 
    })) {
      throw new Error('Failed to install client dependencies');
    }

    // Build client
    console.log('\n🎯 Building client application...');
    if (!runCommand('npm run build', { 
      cwd: clientDir, 
      env: buildEnv 
    })) {
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
