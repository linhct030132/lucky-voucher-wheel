#!/bin/bash

# Production Setup Script for Prisma
# This script ensures Prisma is properly set up in production environments

echo "🚀 Setting up Prisma for production..."

# Step 1: Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Step 2: Check database connection (optional)
if [ "$SKIP_DB_CHECK" != "true" ]; then
    echo "🔍 Testing database connection..."
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    prisma.\$connect()
      .then(() => {
        console.log('✅ Database connection successful');
        return prisma.\$disconnect();
      })
      .catch((error) => {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
      });
    "
fi

echo "🎉 Setup completed successfully!"
