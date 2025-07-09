#!/usr/bin/env node

// Netlify build script - clean approach with minimal dependencies
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Crypto 512 - Clean Netlify Build...');

function runCommand(command, options = {}) {
  try {
    console.log(`\n🔨 Running: ${command}`);
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env }
    });
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${command}`);
    console.error(error.message);
    throw error;
  }
}

try {
  // Set environment variables
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_ENV = 'production';
  process.env.CI = 'true';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  
  const clientDir = path.join(__dirname, 'client');
  console.log(`📂 Working in client directory: ${clientDir}`);
  
  if (!fs.existsSync(clientDir)) {
    throw new Error('Client directory not found');
  }
  
  // Create a minimal package.json for build
  const minimalPackageJson = {
    "name": "crypto-512-client",
    "version": "1.0.0",
    "private": true,
    "dependencies": {
      "@types/node": "^18.0.0",
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "typescript": "4.9.5",
      "web-vitals": "^3.0.0",
      "socket.io-client": "^4.7.0",
      "crypto-js": "^4.1.1"
    },
    "scripts": {
      "build": "react-scripts build"
    },
    "browserslist": {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    }
  };
  
  // Backup original package.json and create minimal one
  const originalPackageJsonPath = path.join(clientDir, 'package.json');
  const backupPackageJsonPath = path.join(clientDir, 'package.json.backup');
  
  if (fs.existsSync(originalPackageJsonPath)) {
    fs.copyFileSync(originalPackageJsonPath, backupPackageJsonPath);
  }
  
  console.log('📝 Creating minimal package.json...');
  fs.writeFileSync(originalPackageJsonPath, JSON.stringify(minimalPackageJson, null, 2));
  
  // Remove existing node_modules and package-lock
  const nodeModulesPath = path.join(clientDir, 'node_modules');
  const packageLockPath = path.join(clientDir, 'package-lock.json');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('🧹 Removing existing node_modules...');
    runCommand('rm -rf node_modules', { cwd: clientDir });
  }
  
  if (fs.existsSync(packageLockPath)) {
    console.log('🧹 Removing package-lock.json...');
    fs.unlinkSync(packageLockPath);
  }
  
  // Fresh install
  console.log('📦 Fresh install of dependencies...');
  runCommand('npm install --legacy-peer-deps', { 
    cwd: clientDir,
    env: {
      NPM_CONFIG_AUDIT: 'false',
      NPM_CONFIG_FUND: 'false'
    }
  });
  
  // Build
  console.log('🏗️ Building client...');
  runCommand('npm run build', { 
    cwd: clientDir,
    env: {
      SKIP_PREFLIGHT_CHECK: 'true',
      GENERATE_SOURCEMAP: 'false',
      NODE_ENV: 'production',
      CI: 'true'
    }
  });
  
  // Restore original package.json
  if (fs.existsSync(backupPackageJsonPath)) {
    console.log('🔄 Restoring original package.json...');
    fs.copyFileSync(backupPackageJsonPath, originalPackageJsonPath);
    fs.unlinkSync(backupPackageJsonPath);
  }
  
  // Verify build
  const buildDir = path.join(clientDir, 'build');
  if (fs.existsSync(buildDir)) {
    console.log('✅ Build completed successfully!');
    const files = fs.readdirSync(buildDir);
    console.log(`📁 Build directory contains ${files.length} files/folders`);
  } else {
    throw new Error('Build directory not created');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
