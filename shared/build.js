#!/usr/bin/env node

// Build script for shared package that doesn't require global TypeScript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building shared package...');

try {
  // Ensure node_modules exists and TypeScript is installed
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }
  
  // Use npx to run TypeScript compiler
  console.log('🔨 Compiling TypeScript...');
  execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
  
  console.log('✅ Shared package built successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
