#!/bin/bash

echo "🚀 Starting Lucky Voucher System (Unified Single Port)..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Load production environment if exists
if [ -f .env.production ]; then
    echo "Loading production environment variables..."
    export $(grep -v '^#' .env.production | xargs)
fi

# Set default port for production (Railway will override this)
export PORT=${PORT:-8080}

# Ensure NODE_ENV is set
export NODE_ENV=${NODE_ENV:-production}

# Set API URL for frontend build (if needed for build-time)
if [ -z "$REACT_APP_API_URL" ]; then
    if [ -n "$RAILWAY_STATIC_URL" ]; then
        export REACT_APP_API_URL="${RAILWAY_STATIC_URL}/api"
    else
        export REACT_APP_API_URL="/api"
    fi
fi

echo "📋 Configuration:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "API URL: $REACT_APP_API_URL"

# Build frontend if not already built
if [ ! -d "frontend/build" ] || [ "$NODE_ENV" = "development" ]; then
    echo "📦 Building frontend..."
    cd frontend
    npm ci --silent
    REACT_APP_API_URL="$REACT_APP_API_URL" npm run build
    cd ..
fi

# Start the unified server (backend serves both API and static files)
echo "🔄 Starting unified server on port $PORT..."
cd backend
PORT=$PORT NODE_ENV=$NODE_ENV npm start
