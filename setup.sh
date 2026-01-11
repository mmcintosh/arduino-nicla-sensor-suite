#!/bin/bash

# Setup script for Arduino Nicla Sense ME IoT Data Platform
# This script helps you set up the development environment

set -e  # Exit on error

echo "🚀 Arduino Nicla Sense ME - IoT Data Platform Setup"
echo "=================================================="
echo ""

# Check Node.js
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check npm
echo "📦 Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi
echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for Wrangler
echo "🔧 Checking Wrangler CLI..."
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler not found. Installing globally..."
    npm install -g wrangler
    echo "✅ Wrangler installed"
else
    echo "✅ Wrangler $(wrangler --version) detected"
fi
echo ""

# Local-only setup (no Cloudflare authentication needed)
echo "💾 Local Database Setup"
echo "----------------------------------------"
echo "For local testing, we'll use Wrangler's local mode."
echo "This creates a local SQLite database - NO Cloudflare account needed!"
echo ""

# Check if .wrangler directory exists
if [ ! -d ".wrangler" ]; then
    mkdir -p .wrangler
    echo "✅ Created .wrangler directory for local development"
fi

# Run migrations locally (this works without Cloudflare auth)
echo "🗄️  Setting up local database and running migrations..."
wrangler d1 migrations apply DB --local
echo "✅ Local database configured successfully"
echo ""

echo "ℹ️  Note: Running in LOCAL MODE"
echo "   - Database is stored in .wrangler/state/"
echo "   - No Cloudflare account required for testing"
echo "   - To deploy to production later, run: wrangler login"

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Open your browser to:"
echo "   http://localhost:8787"
echo ""
echo "3. Upload the Arduino sketch to your Nicla Sense ME:"
echo "   https://create.arduino.cc/editor/FT-CONTENT/333e2e07-ecc4-414c-bf08-005b611ddd75/preview"
echo ""
echo "4. In the web app:"
echo "   - Click 'Start Recording'"
echo "   - Name your session"
echo "   - Click 'Connect' to pair with your Arduino"
echo "   - Watch the data flow!"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: QUICKSTART.md"
echo "   - Full Setup Guide: SETUP.md"
echo "   - Project Overview: README.md"
echo ""
echo "🐛 Troubleshooting:"
echo "   - If database setup failed, run: wrangler d1 create nicla-sensor-db-dev"
echo "   - Then update wrangler.toml with the database ID"
echo "   - Run migrations: wrangler d1 migrations apply nicla-sensor-db-dev --local"
echo ""
echo "Happy monitoring! 🚀"
