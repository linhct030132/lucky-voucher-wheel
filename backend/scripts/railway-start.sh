#!/bin/bash

# Railway Deployment Startup Script
# This script ensures proper database setup and Prisma client generation for Railway

echo "🚀 Starting Railway deployment initialization..."

# Step 1: Run database migrations
echo "📊 Running database migrations..."
npm run db:migrate

# Check if migrations succeeded
if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Database migrations failed"
    exit 1
fi

# Step 2: Generate Prisma client to reflect schema changes
echo "🔧 Regenerating Prisma client to reflect latest schema..."
npx prisma generate

# Check if Prisma generation succeeded
if [ $? -eq 0 ]; then
    echo "✅ Prisma client regenerated successfully"
else
    echo "❌ Prisma client generation failed"
    exit 1
fi

# Step 3: Start the application
echo "🎯 Starting the application..."
node src/server.js
