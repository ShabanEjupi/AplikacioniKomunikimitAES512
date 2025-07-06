#!/usr/bin/env node

// Ultra-simple TypeScript conflict fix for Netlify
const { execSync } = require('child_process');

console.log('🚀 Building Client with TypeScript Conflict Fix...');

// Set environment variables to avoid conflicts
process.env.NODE_ENV = 'production';
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.NPM_CONFIG_LEGACY_PEER_DEPS = 'true';

try {
  // Go to client directory first
  process.chdir('client');
  
  console.log('\n📦 Installing client dependencies with legacy peer deps...');
  // Install dependencies directly in client directory
  execSync('npm install --legacy-peer-deps --no-package-lock', { stdio: 'inherit' });
  
  console.log('\n🎯 Building client...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Build completed successfully!');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
