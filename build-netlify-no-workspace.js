#!/usr/bin/env node

// Completely workspace-free build for Netlify
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Crypto 512 - Workspace-Free Build...');

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
    throw error;
  }
}

try {
  // Set environment variables
  process.env.NODE_ENV = 'production';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  
  const clientDir = path.join(__dirname, 'client');
  
  // Remove all workspace-related files temporarily
  const rootPackageJson = path.join(__dirname, 'package.json');
  const rootPackageLock = path.join(__dirname, 'package-lock.json');
  const rootNodeModules = path.join(__dirname, 'node_modules');
  
  console.log('🧹 Removing workspace files temporarily...');
  
  // Backup and remove root package.json temporarily
  const backupPackageJson = rootPackageJson + '.backup';
  if (fs.existsSync(rootPackageJson)) {
    fs.copyFileSync(rootPackageJson, backupPackageJson);
    fs.unlinkSync(rootPackageJson);
  }
  
  // Change to client directory
  process.chdir(clientDir);
  console.log('📂 Working in:', clientDir);
  
  // Clean install
  console.log('📦 Installing client dependencies...');
  runCommand('npm ci --legacy-peer-deps');
  
  // Build
  console.log('🏗️ Building client...');
  runCommand('npm run build');
  
  // Restore root package.json
  if (fs.existsSync(backupPackageJson)) {
    console.log('🔄 Restoring root package.json...');
    fs.copyFileSync(backupPackageJson, rootPackageJson);
    fs.unlinkSync(backupPackageJson);
  }
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  // Restore package.json in case of error
  const backupPackageJson = path.join(__dirname, 'package.json.backup');
  const rootPackageJson = path.join(__dirname, 'package.json');
  
  if (fs.existsSync(backupPackageJson)) {
    console.log('🔄 Restoring package.json after error...');
    fs.copyFileSync(backupPackageJson, rootPackageJson);
    fs.unlinkSync(backupPackageJson);
  }
  
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
