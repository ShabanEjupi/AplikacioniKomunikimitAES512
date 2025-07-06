#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo "🔨 Building Crypto 512 for Netlify Deployment"
echo "=============================================="
echo ""

# Set Node.js version
export NODE_VERSION="18"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install --legacy-peer-deps

# Install all workspace dependencies
echo "🔧 Installing all workspace dependencies..."
npm run install:all

# Build shared workspace
echo "🏗️ Building shared library..."
npm run build:shared

# Build client workspace
echo "🏗️ Building client application..."
npm run build:client
echo "✅ Client build complete."
echo ""

# Install Netlify functions dependencies
echo "📦 Installing Netlify functions dependencies..."
if [ -f "netlify/functions/package.json" ]; then
  (cd netlify/functions && npm install)
  echo "✅ Functions dependencies installed."
else
  echo "ℹ️ No package.json found in netlify/functions, skipping."
fi
echo ""

echo "🚀 Deployment package is ready!"
