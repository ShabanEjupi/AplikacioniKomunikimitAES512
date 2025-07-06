#!/usr/bin/env node

// Ultra-simple build for Netlify - no workspaces, no conflicts
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Crypto 512 Client (Ultra Simple)...');

try {
  // Set environment variables
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  process.env.NODE_ENV = 'production';
  process.env.NPM_CONFIG_LEGACY_PEER_DEPS = 'true';
  
  // Temporarily remove workspace configuration
  const packageJsonPath = './package.json';
  let originalPackageJson = null;
  
  if (fs.existsSync(packageJsonPath)) {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    originalPackageJson = JSON.parse(packageContent);
    
    if (originalPackageJson.workspaces) {
      const tempPackageJson = { ...originalPackageJson };
      delete tempPackageJson.workspaces;
      fs.writeFileSync(packageJsonPath, JSON.stringify(tempPackageJson, null, 2));
      console.log('✅ Temporarily removed workspaces configuration');
    }
  }
  
  // Change to client directory
  process.chdir('client');
  
  // Clean lockfiles
  ['package-lock.json', 'yarn.lock'].forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Removed ${file}`);
    }
  });
  
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Build
  console.log('🎯 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
