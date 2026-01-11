#!/bin/bash

echo "🛑 Stopping all wrangler processes..."
pkill -9 -f wrangler
pkill -9 -f workerd

echo "🔓 Freeing port 8787..."
fuser -k 8787/tcp 2>/dev/null

echo "⏳ Waiting 2 seconds..."
sleep 2

echo "🚀 Starting server..."
cd /home/siddhartha/Documents/cursor-nicla-sense-me/nicla
npm run dev
