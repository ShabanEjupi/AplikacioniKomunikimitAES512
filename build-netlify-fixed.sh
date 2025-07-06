#!/bin/bash
set -e

echo "🔨 Building Crypto 512 for Netlify Deployment"
echo "=============================================="
echo ""

echo "📦 Installing root dependencies..."
npm ci --legacy-peer-deps

echo "🔧 Installing all workspace dependencies..."
npm run install:all

echo "🏗️ Building shared package..."
cd shared
npm run build || echo "Shared build failed, continuing..."
cd ..

echo "🎯 Building client application..."
cd client
# Ensure TypeScript and all dependencies are available
npm list typescript || npm install typescript@^5.0.0 --legacy-peer-deps

# Check if React Scripts can find TypeScript
echo "Checking TypeScript installation..."
npx tsc --version || echo "TypeScript not found"

# Try to build with verbose output
echo "Building client with React Scripts..."
npm run build
cd ..

echo "⚡ Installing Netlify function dependencies..."
cd netlify/functions
npm install
cd ../..

echo "✅ Build completed successfully!"
