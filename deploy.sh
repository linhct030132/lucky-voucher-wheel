#!/bin/bash

# Lucky Voucher System Deployment Script
# This script helps deploy the application quickly

set -e

echo "🎯 Lucky Voucher System Deployment"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo "⚠️  Don't forget to update the following:"
    echo "   - Database passwords"
    echo "   - JWT secrets"
    echo "   - Email configuration"
    echo ""
    read -p "Press Enter after configuring .env file..."
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images (optional)
read -p "🧹 Do you want to rebuild all images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Rebuilding images..."
    docker-compose build --no-cache
fi

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Test database connection
echo "🗄️ Testing database connection..."
if docker-compose exec -T database mysqladmin ping -h localhost --silent; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
    exit 1
fi

# Test backend health
echo "🔧 Testing backend health..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend is not ready"
    exit 1
fi

# Test frontend
echo "🎨 Testing frontend..."
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   Customer Interface: http://localhost"
echo "   Admin Panel:       http://localhost/admin/login"
echo "   API Health:        http://localhost:5000/api/health"
echo ""
echo "👤 Default Admin Login:"
echo "   Email:    admin@voucher.com"
echo "   Password: admin123"
echo ""
echo "📋 Useful Commands:"
echo "   View logs:      docker-compose logs -f"
echo "   Stop services:  docker-compose down"
echo "   Restart:        docker-compose restart"
echo ""
echo "🛠️ Troubleshooting:"
echo "   - Check .env configuration"
echo "   - Ensure ports 80, 5000, 3306 are available"
echo "   - View service logs for errors"
echo ""
