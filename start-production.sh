#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Set default ports if not provided
export BACKEND_PORT=${BACKEND_PORT:-5000}
export FRONTEND_PORT=${PORT:-3000}

# Ensure REACT_APP_API_URL is set correctly for production
if [ -z "$REACT_APP_API_URL" ]; then
    if [ "$NODE_ENV" = "production" ] && [ -n "$RAILWAY_STATIC_URL" ]; then
        export REACT_APP_API_URL="${RAILWAY_STATIC_URL}/api"
    else
        export REACT_APP_API_URL="http://localhost:${BACKEND_PORT}/api"
    fi
fi

# Ensure FRONTEND_URL is set for CORS
if [ -z "$FRONTEND_URL" ]; then
    if [ "$NODE_ENV" = "production" ] && [ -n "$RAILWAY_STATIC_URL" ]; then
        export FRONTEND_URL="$RAILWAY_STATIC_URL"
    else
        export FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
    fi
fi

echo "Starting Lucky Voucher System..."
echo "NODE_ENV: ${NODE_ENV:-development}"
echo "Backend will run on port: $BACKEND_PORT"
echo "Frontend will run on port: $FRONTEND_PORT"
echo "API URL: $REACT_APP_API_URL"
echo "Frontend URL: $FRONTEND_URL"

# Start both services with concurrently
npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue,green" \
  --kill-others-on-fail \
  "cd backend && PORT=$BACKEND_PORT npm start" \
  "serve -s frontend/build -p $FRONTEND_PORT"
