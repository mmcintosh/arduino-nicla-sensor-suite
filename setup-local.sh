#!/bin/bash

# LOCAL-ONLY Setup Script
# No Cloudflare authentication required!

set -e

echo "🚀 Arduino Nicla Sense ME - Local Setup"
echo "========================================"
echo "This will set up everything for LOCAL testing only."
echo "NO Cloudflare account required!"
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js $NODE_VERSION detected. Need version 18+."
    exit 1
fi

echo "✅ Node.js $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Setup local database
echo "💾 Setting up local database..."
echo "Creating .wrangler directory for local storage..."

# Run migrations in local mode (no auth needed!)
npx wrangler d1 migrations apply DB --local

echo "✅ Local database ready!"
echo ""

echo "========================================"
echo "✅ Local Setup Complete!"
echo "========================================"
echo ""
echo "🎯 Start the app:"
echo "   npm run dev"
echo ""
echo "📱 Then open in Chrome/Edge:"
echo "   http://localhost:8787"
echo ""
echo "📚 Documentation:"
echo "   - LOCAL_TESTING.md - Local testing guide"
echo "   - ARCHITECTURE.md - How this works"
echo "   - QUICKSTART.md - Quick reference"
echo ""
echo "💡 This runs 100% locally - no cloud needed!"
echo ""
