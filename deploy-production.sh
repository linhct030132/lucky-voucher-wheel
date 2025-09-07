#!/bin/bash

echo "🚀 Lucky Voucher System - Production Deployment Script"
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for database
wait_for_db() {
    echo "⏳ Waiting for database to be ready..."
    until docker-compose exec -T database mysqladmin ping -h "localhost" --silent; do
        echo "Database is not ready yet. Waiting..."
        sleep 2
    done
    echo "✅ Database is ready!"
}

# Check if Docker is installed
if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

if [ -f .env.production ]; then
    echo "📋 Loading production environment variables..."
    export $(grep -v '^#' .env.production | xargs)
fi

echo ""
echo "🔧 Deployment Configuration:"
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-8080}"
echo "Database: $(if [ -n "$DATABASE_URL" ]; then echo "External URL"; else echo "Local Docker"; fi)"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.production.yml down

# Build and start the unified application
echo "🏗️  Building and starting the unified application..."
docker-compose -f docker-compose.yml -f docker-compose.production.yml up --build -d

# Wait for database if using local container
if [ -z "$DATABASE_URL" ]; then
    wait_for_db
    
    # Run database migrations
    echo "🗃️  Running database migrations..."
    docker-compose -f docker-compose.yml -f docker-compose.production.yml exec app npm run migrate
fi

# Check if application is healthy
echo "🔍 Checking application health..."
sleep 10

# Try to access the health endpoint
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    echo "✅ Application is healthy and running!"
    echo ""
    echo "🌐 Your Lucky Voucher System is now available at:"
    echo "   http://localhost:8080"
    echo ""
    echo "📊 To view logs, run:"
    echo "   docker-compose -f docker-compose.yml -f docker-compose.production.yml logs -f app"
    echo ""
    echo "🛑 To stop the application, run:"
    echo "   docker-compose -f docker-compose.yml -f docker-compose.production.yml down"
else
    echo "❌ Application health check failed. Checking logs..."
    docker-compose -f docker-compose.yml -f docker-compose.production.yml logs app
    exit 1
fi
