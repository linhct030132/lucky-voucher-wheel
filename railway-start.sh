#!/bin/bash

echo "🚀 Railway Deployment Debug Script"
echo "================================="

echo "📋 Environment Variables:"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "Railway PORT: ${PORT:-not set}"
echo "PWD: $(pwd)"

echo ""
echo "📁 Directory structure:"
ls -la

echo ""
echo "📦 Backend directory:"
if [ -d "backend" ]; then
    echo "✅ backend directory exists"
    ls -la backend/
else
    echo "❌ backend directory missing"
fi

echo ""
echo "🏗️ Frontend build:"
if [ -d "frontend/build" ]; then
    echo "✅ frontend/build exists"
    ls -la frontend/build/ | head -5
else
    echo "❌ frontend/build missing"
fi

echo ""
echo "🔄 Starting backend with explicit PORT..."
cd backend
export NODE_ENV=production
export PORT=${PORT:-8080}
echo "Final PORT: $PORT"
echo "Final NODE_ENV: $NODE_ENV"
npm start
