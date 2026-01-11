#!/bin/bash

echo "🔍 Checking build status..."
npm run build

echo ""
echo "🗄️  Checking database..."
npx wrangler d1 execute DB --local --command="SELECT COUNT(*) as sessions FROM sessions;" 2>/dev/null | grep -A 20 "results"
npx wrangler d1 execute DB --local --command="SELECT COUNT(*) as readings FROM sensor_readings;" 2>/dev/null | grep -A 20 "results"

echo ""
echo "✅ Everything ready! Now start the server:"
echo "   npm run dev"
echo ""
echo "Then:"
echo "1. Open http://localhost:8787/"
echo "2. Look for navigation links in top-right corner"
echo "3. Connect Arduino and start NEW recording"
echo "4. Wait 10-15 seconds, stop recording"
echo "5. Check if data was saved"
