#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Fixing client dependencies and building for Netlify...');

function runCommand(command, options = {}) {
    console.log(`Running: ${command}`);
    try {
        execSync(command, { stdio: 'inherit', ...options });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        process.exit(1);
    }
}

// Navigate to client directory
const clientDir = path.join(__dirname, 'client');

// Add resolutions to client package.json
const clientPackageJsonPath = path.join(clientDir, 'package.json');
const clientPackageJson = JSON.parse(fs.readFileSync(clientPackageJsonPath, 'utf8'));

clientPackageJson.resolutions = {
    "ajv": "^8.12.0",
    "ajv-keywords": "^5.1.0"
};

fs.writeFileSync(clientPackageJsonPath, JSON.stringify(clientPackageJson, null, 2));
console.log('Added resolutions to client/package.json');

// Install dependencies and build
runCommand('npm install --legacy-peer-deps', { cwd: clientDir });
runCommand('npm run build', { cwd: clientDir });

console.log('Build complete.');
