#!/usr/bin/env node

// No-workspace build script for Netlify
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Crypto 512 Client - No Workspace Mode...');

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
      CI: 'false',
      NPM_CONFIG_LEGACY_PEER_DEPS: 'true',
      NPM_CONFIG_WORKSPACES: 'false'
    };

    // Navigate to client directory
    const clientDir = path.join(__dirname, 'client');
    console.log(`\n📁 Working in ${clientDir}...`);
    
    // Temporarily remove workspace references
    const rootPackageJsonPath = path.join(__dirname, 'package.json');
    const rootPackageJsonBackup = path.join(__dirname, 'package.json.backup');
    
    if (fs.existsSync(rootPackageJsonPath)) {
      console.log('\n🔄 Temporarily removing workspace configuration...');
      fs.copyFileSync(rootPackageJsonPath, rootPackageJsonBackup);
      
      const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
      delete rootPackageJson.workspaces;
      fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
    }
    
    // Clean install in client directory
    console.log('\n🧹 Cleaning client dependencies...');
    const lockFiles = ['package-lock.json', 'yarn.lock', 'node_modules'];
    lockFiles.forEach(file => {
      const filePath = path.join(clientDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`🗑️  Removing ${filePath}...`);
        if (file === 'node_modules') {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    });
    
    // Install client dependencies
    console.log('\n📦 Installing client dependencies...');
    if (!runCommand('npm install --legacy-peer-deps --no-optional', { 
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
    
    // Restore workspace configuration
    if (fs.existsSync(rootPackageJsonBackup)) {
      console.log('\n🔄 Restoring workspace configuration...');
      fs.copyFileSync(rootPackageJsonBackup, rootPackageJsonPath);
      fs.unlinkSync(rootPackageJsonBackup);
    }
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    
    // Restore workspace configuration on error
    const rootPackageJsonBackup = path.join(__dirname, 'package.json.backup');
    if (fs.existsSync(rootPackageJsonBackup)) {
      console.log('\n🔄 Restoring workspace configuration after error...');
      fs.copyFileSync(rootPackageJsonBackup, path.join(__dirname, 'package.json'));
      fs.unlinkSync(rootPackageJsonBackup);
    }
    
    process.exit(1);
  }
}

main();
