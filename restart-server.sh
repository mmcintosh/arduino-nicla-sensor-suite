#!/bin/bash

echo "🛑 Stopping any running servers..."
pkill -f "wrangler dev" 2>/dev/null || true
sleep 2

echo "🔨 Building latest code..."
npm run build

echo ""
echo "🚀 Starting server..."
echo "   Server will start on http://localhost:8787/"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Look for navigation links in TOP-RIGHT corner"
echo "   2. Create a NEW recording (old ones have no data)"
echo "   3. Wait 15+ seconds while recording"
echo "   4. Check terminal for 'POST /api/sensor-data' messages"
echo ""
echo "Starting in 3 seconds..."
sleep 3

npm run dev
