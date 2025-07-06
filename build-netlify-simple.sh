#!/bin/bash
set -e

echo "🔨 Crypto 512 - Simplified Netlify Build"
echo "========================================"
echo ""

# Set build environment
export NODE_ENV=production
export SKIP_PREFLIGHT_CHECK=true
export NODE_OPTIONS="--max-old-space-size=4096"
export GENERATE_SOURCEMAP=false

echo "📦 Installing root dependencies..."
npm ci --legacy-peer-deps

echo "🔧 Installing client dependencies directly..."
cd client

# Install TypeScript globally to ensure it's available
npm install -g typescript@^5.0.0

# Install local dependencies
npm install --legacy-peer-deps

echo "🏗️ Building React app..."
npm run build

echo "✅ Client build completed!"
cd ..

echo "⚡ Installing Netlify function dependencies..."
cd netlify/functions
npm install
cd ../..

echo "🎉 Build completed successfully!"
